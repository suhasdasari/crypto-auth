import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    if (!message || !signature) {
      return NextResponse.json(
        { ok: false, error: "Missing message or signature" },
        { status: 400 }
      );
    }

    const siweMessage = new SiweMessage(message);
    const domain = req.headers.get("host") ?? new URL(req.url).host;
    const result = await siweMessage.verify({
      signature,
      domain,
      time: new Date().toISOString(),
    });
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const session = await getSession();
    session.address = siweMessage.address;
    session.chainId = siweMessage.chainId;
    session.issuedAt = siweMessage.issuedAt;
    session.expirationTime = siweMessage.expirationTime;
    await session.save();

    return NextResponse.json({ ok: true, address: session.address });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Bad request" },
      { status: 400 }
    );
  }
}
