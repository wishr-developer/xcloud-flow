import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.name || !body.email || !body.message) {
    return NextResponse.json(
      { ok: false, error: "必須項目が不足しています" },
      { status: 400 }
    );
  }
  const supabase = createClient();
  const { error } = await supabase.from("contacts").insert({
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    subject: body.subject || null,
    message: body.message,
    status: "new",
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
