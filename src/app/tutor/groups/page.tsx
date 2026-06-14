import { getGroups } from "@/lib/groups";
import GroupManager from "@/components/tutor/groups/GroupManager";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const { groups, students } = await getGroups();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-5">
      <header className="motion-safe:animate-rise-in">
        <h1 className="font-display text-h1 font-extrabold text-ink">กลุ่ม/ห้องเรียน</h1>
        <p className="mt-2 text-muted sm:text-lg">
          จัดนักเรียนเป็นห้อง แล้วมอบหมายข้อสอบทั้งห้องได้ในคลิกเดียว
        </p>
      </header>
      <GroupManager groups={groups} students={students} />
    </main>
  );
}
