import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  return NextResponse.json({ nonce });
}
