import ExamRunner from "@/components/ExamRunner";
import { getProfile } from "@/lib/profile";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const profile = await getProfile();
  return (
    <ExamRunner
      examId={examId}
      studentName={profile.full_name || profile.username}
    />
  );
}
