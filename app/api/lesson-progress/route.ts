import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.enrollment_id || !body.lesson_id) {
    return NextResponse.json(
      { ok: false, error: "必須項目が不足しています" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // Verify enrollment ownership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id")
    .eq("id", body.enrollment_id)
    .maybeSingle();
  if (!enrollment) {
    return NextResponse.json(
      { ok: false, error: "受講情報が見つかりません" },
      { status: 404 }
    );
  }
  if (enrollment.user_id && user && enrollment.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "権限がありません" }, { status: 403 });
  }

  const completed = body.completed !== false;
  const completedAt = completed ? new Date().toISOString() : null;

  // Upsert progress
  await supabase.from("lesson_progress").upsert(
    {
      enrollment_id: enrollment.id,
      lesson_id: body.lesson_id,
      completed,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
      watched_seconds: body.watched_seconds ?? 0,
    },
    { onConflict: "enrollment_id,lesson_id" }
  );

  // Recompute progress_percent
  const { data: totals } = await supabase
    .from("course_lessons")
    .select("id, module:module_id!inner(course_id)")
    .eq("module.course_id", enrollment.course_id);
  const totalLessons = totals?.length ?? 0;

  const { data: doneRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id", { count: "exact" })
    .eq("enrollment_id", enrollment.id)
    .eq("completed", true);
  const doneCount = doneRows?.length ?? 0;

  const pct = totalLessons === 0 ? 0 : Math.round((doneCount / totalLessons) * 100);

  const update: Record<string, unknown> = {
    progress_percent: pct,
    last_accessed_at: new Date().toISOString(),
  };
  if (pct >= 100) {
    update.status = "completed";
    update.completed_at = new Date().toISOString();
  }

  await supabase.from("enrollments").update(update).eq("id", enrollment.id);

  // Issue a certificate when complete
  if (pct >= 100) {
    const certNumber = `XCF-${Date.now().toString(36).toUpperCase()}`;
    await supabase
      .from("certificates")
      .upsert({ enrollment_id: enrollment.id, certificate_number: certNumber }, {
        onConflict: "enrollment_id",
      });
  }

  return NextResponse.json({ ok: true, progress_percent: pct });
}
