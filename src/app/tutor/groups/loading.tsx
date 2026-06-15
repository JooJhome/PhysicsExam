import { PageHeaderSkeleton, ToolbarSkeleton, ListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main aria-busy className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-5">
      <span className="sr-only">กำลังโหลด…</span>
      <PageHeaderSkeleton />
      <div className="mt-6">
        <ToolbarSkeleton />
        <ListSkeleton rows={5} />
      </div>
    </main>
  );
}
