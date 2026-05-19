"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function CompleteLessonButton({
  enrollmentId,
  lessonId,
  initialCompleted,
  nextHref,
}: {
  enrollmentId: string;
  lessonId: string;
  initialCompleted: boolean;
  nextHref?: string;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function onComplete() {
    setLoading(true);
    const res = await fetch("/api/lesson-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        completed: true,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setCompleted(true);
      if (nextHref) {
        router.push(nextHref);
      } else {
        router.refresh();
      }
    }
  }

  if (completed) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        このレッスンを完了済み
      </div>
    );
  }

  return (
    <Button onClick={onComplete} disabled={loading}>
      <CheckCircle2 className="mr-1 h-4 w-4" />
      {loading ? "記録中..." : "完了として記録"}
    </Button>
  );
}
