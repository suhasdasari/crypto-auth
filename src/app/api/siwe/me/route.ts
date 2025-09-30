import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.address) {
    return NextResponse.json({ ok: false, address: null });
  }
  return NextResponse.json({ ok: true, address: session.address });
}
