"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExamListItem } from "@/lib/exams";
import type { Filters, StatusFilter } from "./FilterBar";

export type SortKey = "recent" | "name" | "avg" | "submitted";
export type ViewMode = "card" | "table";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "ล่าสุด" },
  { key: "name", label: "ชื่อ A–Z" },
  { key: "avg", label: "คะแนนเฉลี่ย" },
  { key: "submitted", label: "จำนวนที่ส่ง" },
];

function parse(sp: URLSearchParams) {
  const status = sp.get("status");
  const sort = sp.get("sort");
  const view = sp.get("view");
  return {
    filters: {
      status:
        status === "published" || status === "draft" ? (status as StatusFilter) : "all",
      subject: sp.get("subject") ?? "",
      q: sp.get("q") ?? "",
    } as Filters,
    sort: (["recent", "name", "avg", "submitted"].includes(sort ?? "")
      ? sort
      : "recent") as SortKey,
    view: (view === "table" ? "table" : "card") as ViewMode,
  };
}

/**
 * Data layer ของหน้าจัดการข้อสอบ — แยกจาก presentation
 * filter/sort/view เก็บใน URL query (ออกแบบให้ย้ายไป server-side ได้ภายหลัง
 * และให้ทั้ง card/table view ใช้ list เดียวกัน)
 */
export function useExamList(exams: ExamListItem[]) {
  const router = useRouter();
  const sp = useSearchParams();
  const { filters, sort, view } = useMemo(
    () => parse(new URLSearchParams(sp.toString())),
    [sp]
  );

  const commit = useCallback(
    (next: { filters?: Filters; sort?: SortKey; view?: ViewMode }) => {
      const f = next.filters ?? filters;
      const s = next.sort ?? sort;
      const v = next.view ?? view;
      const p = new URLSearchParams();
      if (f.status !== "all") p.set("status", f.status);
      if (f.subject) p.set("subject", f.subject);
      if (f.q.trim()) p.set("q", f.q.trim());
      if (s !== "recent") p.set("sort", s);
      if (v !== "card") p.set("view", v);
      const qs = p.toString();
      router.replace(qs ? `/tutor/exams?${qs}` : "/tutor/exams", { scroll: false });
    },
    [filters, sort, view, router]
  );

  const list = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const out = exams.filter((e) => {
      if (filters.status !== "all" && e.status !== filters.status) return false;
      if (filters.subject && !e.subjects.includes(filters.subject)) return false;
      if (q && !`${e.title} ${e.code}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const sorted = [...out];
    switch (sort) {
      case "name":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "th"));
        break;
      case "avg":
        sorted.sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1));
        break;
      case "submitted":
        sorted.sort((a, b) => b.submittedCount - a.submittedCount);
        break;
      case "recent":
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
    }
    return sorted;
  }, [exams, filters, sort]);

  const hasFilter =
    filters.status !== "all" || filters.subject !== "" || filters.q.trim() !== "";

  return {
    list,
    filters,
    sort,
    view,
    hasFilter,
    setFilters: (filters: Filters) => commit({ filters }),
    setSort: (sort: SortKey) => commit({ sort }),
    setView: (view: ViewMode) => commit({ view }),
    clearFilters: () => commit({ filters: { status: "all", subject: "", q: "" } }),
  };
}
