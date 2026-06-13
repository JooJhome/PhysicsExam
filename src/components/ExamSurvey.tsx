"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RatingDef {
  key: "difficulty" | "time_adequacy" | "confidence" | "stress";
  label: string;
  low: string;
  high: string;
}

const RATINGS: RatingDef[] = [
  { key: "difficulty", label: "ข้อสอบยากแค่ไหน", low: "ง่ายมาก", high: "ยากมาก" },
  { key: "time_adequacy", label: "เวลาทำข้อสอบเพียงพอไหม", low: "ไม่พอเลย", high: "เหลือเฟือ" },
  { key: "confidence", label: "มั่นใจในคำตอบแค่ไหน", low: "ไม่มั่นใจเลย", high: "มั่นใจมาก" },
  { key: "stress", label: "เครียด/กดดันระหว่างสอบแค่ไหน", low: "ไม่เครียดเลย", high: "เครียดมาก" },
];

type Ratings = Record<RatingDef["key"], number | null>;

export default function ExamSurvey({
  examId,
  onDone,
}: {
  examId: string;
  onDone: () => void;
}) {
  const [ratings, setRatings] = useState<Ratings>({
    difficulty: null,
    time_adequacy: null,
    confidence: null,
    stress: null,
  });
  const [hardestTopics, setHardestTopics] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = RATINGS.every((r) => ratings[r.key] !== null);

  async function handleSubmit() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("submit_survey", {
      p_exam_id: examId,
      p_difficulty: ratings.difficulty,
      p_time_adequacy: ratings.time_adequacy,
      p_confidence: ratings.confidence,
      p_stress: ratings.stress,
      p_hardest_topics: hardestTopics,
      p_comment: comment,
    });
    if (error) {
      setSubmitting(false);
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    onDone();
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h1 className="text-lg font-bold text-gray-900">ส่งคำตอบเรียบร้อย 🎉</h1>
        <p className="mt-1 text-sm text-gray-500">
          ก่อนออก ช่วยตอบแบบสอบถามสั้นๆ เพื่อให้ติวเตอร์ปรับการสอนให้ดีขึ้น
          (บังคับตอบทุกข้อให้ครบ)
        </p>

        <div className="mt-6 space-y-6">
          {RATINGS.map((r) => (
            <div key={r.key}>
              <p className="text-sm font-semibold text-gray-800">{r.label}</p>
              <div className="mt-2 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRatings((s) => ({ ...s, [r.key]: n }))}
                    className={`h-10 w-10 rounded-lg text-sm font-semibold ring-1 transition ${
                      ratings[r.key] === n
                        ? "bg-blue-600 text-white ring-blue-600"
                        : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>{r.low}</span>
                <span>{r.high}</span>
              </div>
            </div>
          ))}

          <div>
            <label className="text-sm font-semibold text-gray-800">
              หัวข้อ/บทที่รู้สึกยากที่สุด{" "}
              <span className="font-normal text-gray-400">(ถ้ามี)</span>
            </label>
            <input
              type="text"
              value={hardestTopics}
              onChange={(e) => setHardestTopics(e.target.value)}
              placeholder="เช่น กลศาสตร์ของไหล, ไฟฟ้า"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800">
              ความเห็นเพิ่มเติมถึงติวเตอร์{" "}
              <span className="font-normal text-gray-400">(ถ้ามี)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="อยากให้สอนเพิ่มเรื่องไหน หรือมีอะไรอยากบอก..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!complete || submitting}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "กำลังบันทึก..."
            : complete
            ? "ส่งแบบสอบถามและออก"
            : "กรุณาให้คะแนนให้ครบทุกข้อ"}
        </button>
      </div>
    </main>
  );
}
