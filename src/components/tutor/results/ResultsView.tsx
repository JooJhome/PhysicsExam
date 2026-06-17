"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ResultsData, SubmissionRow, StudentSummary } from "@/lib/results";
import { resetAttempt, setPassingScore } from "@/lib/actions/tutor";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExamMenu, { type MenuItem } from "@/components/tutor/exams/ExamMenu";
import ExamSummaryView from "./ExamSummaryView";
import BreakdownDrawer from "./BreakdownDrawer";
import SurveyDrawer from "./SurveyDrawer";
import StudentScoresDrawer from "./StudentScoresDrawer";

type View = "submissions" | "exams" | "students";

export default function ResultsView({ data }: { data: ResultsData }) {
  const router = useRouter();
  const [view, setView] = useState<View>("submissions");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const inGroup = (studentId: string) =>
    groupFilter === "all" || (data.studentGroups[studentId] ?? []).includes(groupFilter);
  const [pending, startTransition] = useTransition();
  const [breakdown, setBreakdown] = useState<{ id: string; code: string } | null>(null);
  const [survey, setSurvey] = useState<{ id: string; code: string } | null>(null);
  const [studentDrill, setStudentDrill] = useState<StudentSummary | null>(null);
  const [toReset, setToReset] = useState<SubmissionRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const term = q.trim().toLowerCase();
  const submissions = useMemo(
    () =>
      data.submissions.filter(
        (s) =>
          inGroup(s.studentId) &&
          (!term || `${s.studentName} ${s.examCode}`.toLowerCase().includes(term))
      ),
    [data.submissions, term, groupFilter]
  );
  const students = useMemo(
    () =>
      data.students.filter(
        (s) =>
          inGroup(s.studentId) &&
          (!term || `${s.username} ${s.displayName ?? ""}`.toLowerCase().includes(term))
      ),
    [data.students, term, groupFilter]
  );
  const anomalies = data.exams.filter((e) => e.anomalyFlag);
  const sortedExams = useMemo(
    () =>
      sort === "name"
        ? [...data.exams].sort((a, b) => a.examTitle.localeCompare(b.examTitle, "th"))
        : data.exams,
    [data.exams, sort]
  );
  const sortedStudents = useMemo(
    () =>
      sort === "name"
        ? [...students].sort((a, b) =>
            (a.displayName || a.username).localeCompare(b.displayName || b.username, "th")
          )
        : students,
    [students, sort]
  );

  function act(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const r = await fn();
      setMsg(r.message);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {/* tiles */}
      <div className="grid grid-cols-2 gap-3 motion-safe:animate-rise-in sm:grid-cols-4">
        <Tile label="ส่งแล้ว" value={data.tiles.submitted} tone="green" />
        <Tile label="กำลังทำ" value={data.tiles.inProgress} tone="amber" />
        <Tile label="ยังไม่เริ่ม" value={data.tiles.notStarted} tone="plain" />
        <Tile
          label="คะแนนเฉลี่ย"
          value={data.tiles.avgPercent != null ? `${data.tiles.avgPercent}%` : "—"}
          tone="plain"
        />
      </div>

      {/* anomaly banners */}
      {anomalies.map((e) => (
        <button
          key={e.examId}
          type="button"
          onClick={() => setBreakdown({ id: e.examId, code: e.examCode })}
          className="block w-full rounded-xl bg-accent-50 px-4 py-3 text-left text-sm text-accent-800 ring-1 ring-accent-100 transition-colors hover:bg-accent-100"
        >
          เฉลี่ยของ <b>{e.examCode}</b> = {e.avgPercent}% จาก {e.submitted} คน —
          คะแนนต่ำผิดปกติทั้งชุด อาจตรวจเฉลยเพี้ยน{" "}
          <span className="font-bold underline">ตรวจ mapping เฉลย</span>
        </button>
      ))}

      {/* toolbar: search (flex-1) + view switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            inputMode="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นนักเรียน / ชุด"
            aria-label="ค้นหา"
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-base transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="flex flex-none gap-1 rounded-xl bg-canvas p-1">
          {(
            [
              ["submissions", "รายการส่ง"],
              ["exams", "สรุปรายชุด"],
              ["students", "สรุปรายคน"],
            ] as [View, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`flex-1 min-h-[40px] whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                view === key ? "bg-brand-600 text-white shadow-sm" : "text-ink-soft hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* กรองตามกลุ่ม (มีผลกับ รายการส่ง + สรุปรายคน) */}
      {data.groups.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setGroupFilter("all")}
            className={`flex-none rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              groupFilter === "all"
                ? "bg-brand-600 text-white"
                : "border border-line bg-white text-ink-soft hover:border-brand-200"
            }`}
          >
            ทุกกลุ่ม
          </button>
          {data.groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupFilter(g.id)}
              className={`flex-none rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                groupFilter === g.id
                  ? "bg-brand-600 text-white"
                  : "border border-line bg-white text-ink-soft hover:border-brand-200"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {msg && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">{msg}</p>}

      {groupFilter !== "all" && view === "exams" && (
        <p className="rounded-xl bg-sand-100 px-4 py-2.5 text-sm text-muted">
          สรุปรายชุดแสดงทุกคน — ตัวกรองกลุ่มมีผลกับ “รายการส่ง” และ “สรุปรายคน”
        </p>
      )}

      {/* views */}
      {view === "submissions" && (
        <SubmissionList
          rows={submissions}
          onBreakdown={(r) => setBreakdown({ id: r.examId, code: r.examCode })}
          onReset={(r) => setToReset(r)}
        />
      )}
      {view === "exams" && (
        <>
          {data.exams.length > 1 && <SortSelect value={sort} onChange={setSort} />}
          <ExamSummaryView
            exams={sortedExams}
            pending={pending}
            onSavePassing={(id, score) => act(() => setPassingScore(id, score))}
            onOpenBreakdown={(id, code) => setBreakdown({ id, code })}
            onOpenSurvey={(id, code) => setSurvey({ id, code })}
          />
        </>
      )}
      {view === "students" && (
        <>
          {students.length > 1 && <SortSelect value={sort} onChange={setSort} />}
          <StudentList rows={sortedStudents} onOpen={(id) => setStudentDrill(id)} />
        </>
      )}

      {breakdown && (
        <BreakdownDrawer examId={breakdown.id} examCode={breakdown.code} onClose={() => setBreakdown(null)} />
      )}

      {survey && (
        <SurveyDrawer examId={survey.id} examCode={survey.code} onClose={() => setSurvey(null)} />
      )}

      {studentDrill && (
        <StudentScoresDrawer
          studentId={studentDrill.studentId}
          studentName={studentDrill.displayName || studentDrill.username}
          rows={data.submissions.filter((r) => r.studentId === studentDrill.studentId)}
          onClose={() => setStudentDrill(null)}
        />
      )}

      <ConfirmDialog
        open={toReset !== null}
        title="รีเซ็ตการทำข้อสอบ?"
        body={
          <p>
            รีเซ็ต <b className="text-ink">{toReset?.studentName}</b> ในชุด{" "}
            <b className="text-ink">{toReset?.examCode}</b>? การส่งครั้งนี้จะถูกลบ
            (เก็บประวัติไว้) นักเรียนทำใหม่ได้อีก 1 ครั้ง
          </p>
        }
        confirmLabel="รีเซ็ต"
        cancelLabel="ยกเลิก"
        tone="danger"
        busy={pending}
        onConfirm={() => {
          const r = toReset;
          setToReset(null);
          if (r) act(() => resetAttempt(r.examId, r.studentId));
        }}
        onCancel={() => setToReset(null)}
      />
    </div>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: "recent" | "name";
  onChange: (v: "recent" | "name") => void;
}) {
  return (
    <div className="flex justify-end">
      <label className="relative">
        <span className="sr-only">เรียงลำดับ</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as "recent" | "name")}
          className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-white pl-3.5 pr-9 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="recent">เรียง: ล่าสุด</option>
          <option value="name">เรียง: ชื่อ A–Z</option>
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </label>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number | string; tone: "green" | "amber" | "plain" }) {
  const valueCls =
    tone === "green" ? "text-green-700" : tone === "amber" ? "text-accent-700" : "text-ink";
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className={`mt-0.5 font-display text-2xl font-extrabold tabular-nums ${valueCls}`}>{value}</p>
    </div>
  );
}

function ScoreChip({ row }: { row: SubmissionRow }) {
  if (row.status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-800">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
        กำลังทำ
      </span>
    );
  }
  const veryLow = row.percent != null && row.percent < 15;
  const tone = row.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600";
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="font-display text-base font-bold tabular-nums text-ink">
        {row.score}
        <span className="text-muted">/{row.total}</span>
        <span className="ml-1 text-sm text-muted">· {row.percent}%</span>
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>
        {veryLow ? "ต่ำมาก" : row.passed ? "ผ่าน" : "ไม่ผ่าน"}
      </span>
    </div>
  );
}

function SubmissionList({
  rows,
  onBreakdown,
  onReset,
}: {
  rows: SubmissionRow[];
  onBreakdown: (r: SubmissionRow) => void;
  onReset: (r: SubmissionRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-card">
        <p className="text-2xl">📊</p>
        <p className="mt-2 font-semibold text-ink">ยังไม่มีการทำข้อสอบ</p>
        <p className="mt-1 text-sm text-muted">เมื่อนักเรียนเริ่มทำ ผลจะปรากฏที่นี่</p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {rows.map((r) => {
        const menu: MenuItem[] = [
          { kind: "button", label: "วิเคราะห์รายข้อ", onClick: () => onBreakdown(r) },
          { kind: "button", label: "รีเซ็ตการทำข้อสอบ", onClick: () => onReset(r), danger: true },
        ];
        return (
          <article
            key={r.attemptId}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-line bg-white p-4 shadow-card"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand-50 font-display text-sm font-bold uppercase text-brand-700">
              {r.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{r.studentName}</p>
              <span className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 font-display text-xs font-bold text-brand-700">
                {r.examCode}
              </span>
            </div>
            <ScoreChip row={r} />
            <span className="hidden whitespace-nowrap text-sm text-muted sm:inline">
              {r.submittedAt ? new Date(r.submittedAt).toLocaleString("th-TH") : "—"}
            </span>
            <ExamMenu items={menu} />
          </article>
        );
      })}
    </div>
  );
}

function StudentList({
  rows,
  onOpen,
}: {
  rows: StudentSummary[];
  onOpen: (s: StudentSummary) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-5 py-14 text-center shadow-card">
        <p className="text-2xl">👤</p>
        <p className="mt-2 font-semibold text-ink">ยังไม่มีผลรายคน</p>
      </div>
    );
  }
  const trendLabel = { up: "ดีขึ้น ↑", down: "แย่ลง ↓", flat: "คงที่ →" };
  const trendCls = { up: "text-green-700", down: "text-red-600", flat: "text-muted" };
  return (
    <div className="space-y-2.5">
      {rows.map((s) => (
        <button
          key={s.studentId}
          type="button"
          onClick={() => onOpen(s)}
          aria-label={`ดูคะแนนรายชุดของ ${s.displayName || s.username}`}
          className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-card transition-shadow hover:shadow-lift"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand-50 font-display text-sm font-bold uppercase text-brand-700">
            {s.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">
              {s.username}
              {s.displayName && <span className="text-sm font-normal text-muted"> · {s.displayName}</span>}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
              <span>
                มอบหมาย <b className="font-display font-bold tabular-nums text-ink-soft">{s.assignedCount}</b>
              </span>
              <span className="text-line">·</span>
              <span>
                ทำเสร็จ <b className="font-display font-bold tabular-nums text-ink-soft">{s.examsTaken}</b>
              </span>
              {s.avgPercent != null && (
                <>
                  <span className="text-line">·</span>
                  <span>
                    เฉลี่ย <b className="font-display font-bold tabular-nums text-ink-soft">{s.avgPercent}%</b>
                  </span>
                </>
              )}
              {s.trend && (
                <>
                  <span className="text-line">·</span>
                  <span className={`font-semibold ${trendCls[s.trend]}`}>{trendLabel[s.trend]}</span>
                </>
              )}
            </p>
          </div>
          <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
