import type { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  address?: string;
  chainId?: number;
  issuedAt?: string;
  expirationTime?: string;
};

const sessionPassword = process.env.IRON_SESSION_PASSWORD;

if (!sessionPassword) {
  // eslint-disable-next-line no-console
  console.warn(
    "IRON_SESSION_PASSWORD is not set. Set it in .env.local (32+ chars) before production."
  );
}

export const sessionOptions: SessionOptions = {
  password:
    sessionPassword || "development-only-password-change-me-1234567890123456",
  cookieName: "siwe_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  const cookieStore = await (cookies() as unknown as Promise<any>);
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
