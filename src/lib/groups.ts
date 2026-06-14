import { createClient } from "@/lib/supabase/server";

export type GroupMemberLite = {
  id: string;
  username: string;
  displayName: string | null;
};

export type GroupListItem = {
  id: string;
  name: string;
  color: string | null;
  note: string | null;
  memberCount: number;
  members: GroupMemberLite[];
};

export type GroupsOverview = {
  groups: GroupListItem[];
  students: GroupMemberLite[]; // นักเรียนทั้งหมด (ไว้ทำ picker)
};

export async function getGroups(): Promise<GroupsOverview> {
  const supabase = await createClient();
  const [groupsRes, membersRes, studentsRes] = await Promise.all([
    supabase.from("groups").select("id, name, color, note").order("name"),
    supabase.from("group_members").select("group_id, student_id"),
    supabase.from("profiles").select("id, username, full_name").eq("role", "student").order("username"),
  ]);

  const students = (studentsRes.data ?? []).map((s) => ({
    id: s.id,
    username: s.username,
    displayName: s.full_name?.trim() || null,
  }));
  const studentById = new Map(students.map((s) => [s.id, s]));

  const membersByGroup = new Map<string, GroupMemberLite[]>();
  for (const m of membersRes.data ?? []) {
    const s = studentById.get(m.student_id);
    if (!s) continue; // เผื่อ orphan
    const arr = membersByGroup.get(m.group_id) ?? [];
    arr.push(s);
    membersByGroup.set(m.group_id, arr);
  }

  const groups = (groupsRes.data ?? []).map((g) => {
    const members = membersByGroup.get(g.id) ?? [];
    return {
      id: g.id,
      name: g.name,
      color: g.color ?? null,
      note: g.note ?? null,
      memberCount: members.length,
      members,
    };
  });

  return { groups, students };
}

/** แผนที่ studentId → รายชื่อกลุ่มที่สังกัด (id+name) — ใช้ทำ badge/filter ในหน้าอื่น */
export type GroupRef = { id: string; name: string; color: string | null };

export async function getStudentGroupMap(): Promise<{
  groups: GroupRef[];
  byStudent: Record<string, string[]>; // studentId → groupId[]
}> {
  const supabase = await createClient();
  const [groupsRes, membersRes] = await Promise.all([
    supabase.from("groups").select("id, name, color").order("name"),
    supabase.from("group_members").select("group_id, student_id"),
  ]);

  const byStudent: Record<string, string[]> = {};
  for (const m of membersRes.data ?? []) {
    (byStudent[m.student_id] ??= []).push(m.group_id);
  }
  const groups = (groupsRes.data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color ?? null,
  }));
  return { groups, byStudent };
}
