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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600 text-sm">
          Sign in with your Ethereum wallet
        </p>
      </div>

      {/* Content */}
      {!isConnected ? (
        <button
          onClick={login}
          disabled={loading || isPending}
          className="w-full bg-black text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Signing...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
      ) : (
        <div className="space-y-6">
          {/* Connected Status */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Connected</p>
                <p className="text-xs text-gray-500 font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={login}
              disabled={loading}
              className="w-full bg-black text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing Message...
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2v6m-2 0a2 2 0 002-2m0 0a2 2 0 00-2-2m2 2V9m-2 0a2 2 0 012-2m0 0a2 2 0 012 2m-2-2V7"
                    />
                  </svg>
                  Sign In with Ethereum
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={switchAccount}
                className="bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Switch
              </button>
              <button
                onClick={logout}
                className="bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
