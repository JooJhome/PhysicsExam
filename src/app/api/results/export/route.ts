import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Row {
  status: string;
  score: number | null;
  total: number | null;
  started_at: string;
  submitted_at: string | null;
  exams: { title: string; exam_code: string } | null;
  profiles: { username: string; full_name: string | null } | null;
}

function cell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "tutor")
    return new NextResponse("forbidden", { status: 403 });

  const { data } = await supabase
    .from("attempts")
    .select(
      "status, score, total, started_at, submitted_at, exams(title, exam_code), profiles(username, full_name)"
    )
    .order("submitted_at", { ascending: false, nullsFirst: false });

  const rows = (data as unknown as Row[]) ?? [];
  const head = [
    "username",
    "full_name",
    "exam_code",
    "exam_title",
    "status",
    "score",
    "total",
    "started_at",
    "submitted_at",
  ];
  const lines = [head.join(",")];
  for (const r of rows) {
    lines.push(
      [
        cell(r.profiles?.username),
        cell(r.profiles?.full_name),
        cell(r.exams?.exam_code),
        cell(r.exams?.title),
        cell(r.status),
        cell(r.score),
        cell(r.total),
        cell(r.started_at),
        cell(r.submitted_at),
      ].join(",")
    );
  }

  // BOM เพื่อให้ Excel เปิดภาษาไทยถูก
  const csv = "﻿" + lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="results.csv"',
    },
  });
}
