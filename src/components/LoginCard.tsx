"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useAccount,
  useConnect,
  useSignMessage,
  useChainId,
  useDisconnect,
} from "wagmi";
import { SiweMessage } from "siwe";
import { getAddress } from "viem";

export function LoginCard() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const login = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (!isConnected) {
        const metamask = connectors.find((c) => c.id === "injected");
        await connect({ connector: metamask ?? connectors[0] });
      }

      const nonceRes = await fetch("/api/siwe/nonce");
      const { nonce } = await nonceRes.json();

      const domain = window.location.host;
      const uri = window.location.origin;

      let userAddress: `0x${string}` | undefined = address as
        | `0x${string}`
        | undefined;
      if (!userAddress && (window as any).ethereum) {
        const accounts: string[] = await (window as any).ethereum.request({
          method: "eth_accounts",
        });
        userAddress = (accounts?.[0] as `0x${string}`) ?? undefined;
      }
      if (!userAddress) throw new Error("No wallet address available");

      // Ensure EIP-55 checksum formatting
      userAddress = getAddress(userAddress);

      const siweMsg = new SiweMessage({
        domain,
        address: userAddress,
        statement: "Sign in with Ethereum to the app.",
        uri,
        version: "1",
        chainId,
        nonce,
      });

      const prepared = siweMsg.prepareMessage();
      const signature = await signMessageAsync({ message: prepared });

      const verifyRes = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prepared, signature }),
      });
      const verify = await verifyRes.json();
      if (!verify.ok) throw new Error(verify.error || "Verification failed");
    } catch (e: any) {
      setError(e?.message ?? "Failed to login");
    } finally {
      setLoading(false);
    }
  }, [address, chainId, connectors, connect, isConnected, signMessageAsync]);

  const logout = useCallback(async () => {
    await fetch("/api/siwe/logout", { method: "POST" });
    disconnect();
  }, []);

  const switchAccount = useCallback(async () => {
    try {
      if ((window as any).ethereum?.request) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (_) {
          await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          });
        }
      }
      disconnect();
      const metamask = connectors.find((c) => c.id === "injected");
      await connect({ connector: metamask ?? connectors[0] });
    } catch {
      // ignore
    }
  }, [connect, connectors, disconnect]);

  if (!mounted) return null;

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "40px auto",
        padding: 24,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        background: "white",
      }}
    >
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Passwordless Login
      </h3>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        SIWE (EIP-4361) with MetaMask
      </p>
      {!isConnected ? (
        <button
          onClick={login}
          disabled={loading || isPending}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            background: "#111827",
            color: "white",
          }}
        >
          {loading ? "Signing..." : "Login with MetaMask"}
        </button>
      ) : (
        <div>
          <div style={{ fontSize: 14, marginBottom: 12 }}>
            Connected: {address}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={login}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#111827",
                color: "white",
              }}
            >
              {loading ? "Signing..." : "Sign-in (SIWE)"}
            </button>
            <button
              onClick={switchAccount}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#e5e7eb",
              }}
            >
              Switch account
            </button>
            <button
              onClick={logout}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#e5e7eb",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
      {error && <div style={{ color: "#b91c1c", marginTop: 12 }}>{error}</div>}
    </div>
  );
}
