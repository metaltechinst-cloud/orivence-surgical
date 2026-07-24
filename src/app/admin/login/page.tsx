// src/app/admin/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Key, User, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  
  // Credentials form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // If already logged in, redirect directly to dashboard
    const token = localStorage.getItem("admin_token");
    if (token) {
      router.push("/admin/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.twoFactorRequired) {
        // Switch UI to prompt for OTP code
        setTempToken(data.tempToken);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      // Save token in localStorage
      localStorage.setItem("admin_token", data.token || "authenticated");
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      window.location.href = "/admin/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "2FA verification failed");
      }

      // Successful 2FA verification
      localStorage.setItem("admin_token", data.token || "authenticated");
      localStorage.setItem("admin_user", JSON.stringify(data.user));

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "2FA validation failed.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-[#E0FBFC] via-white to-[#C2DFE3]/40 min-h-screen flex items-center justify-center pt-24 pb-24 relative font-sans">
      <div className="absolute inset-0 drafting-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 font-sans">
        
        <div className="glass-panel p-8 rounded-2xl border border-[#C2DFE3] shadow-luxury-lg relative overflow-hidden bg-white/95 backdrop-blur-md">
          
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#9DB4C0]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#9DB4C0]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#9DB4C0]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#9DB4C0]" />

          {/* Heading */}
          <div className="text-center flex flex-col items-center gap-3 mb-8 font-sans">
            <svg
              viewBox="0 0 100 100"
              className="w-12 h-12 stroke-[#253237] fill-none"
              strokeWidth="1.5"
            >
              <circle cx="50" cy="50" r="40" className="opacity-20" />
              <polygon points="50,18 82,50 50,82 18,50" className="opacity-50" />
              <line x1="50" y1="10" x2="50" y2="90" />
              <circle cx="50" cy="50" r="3" className="fill-[#253237]" />
            </svg>
            <div>
              <h1 className="text-base font-bold tracking-widest text-[#253237] uppercase font-sans">
                ORIVENCE
              </h1>
              <span className="text-[9px] font-mono text-[#5C6B73] uppercase mt-1 block font-bold">
                ADMIN CONSOLE LOGIN
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg text-xs text-red-600 flex items-start gap-2 mb-6 font-sans">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!show2FA ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-sans">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-[#5C6B73] uppercase flex items-center gap-1 font-bold">
                  <User className="w-3 h-3" />
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="bg-[#E0FBFC]/50 border border-[#C2DFE3] rounded px-3.5 py-2.5 text-xs text-[#253237] placeholder-[#9DB4C0] focus:outline-none focus:border-[#5C6B73] transition-colors font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-[#5C6B73] uppercase flex items-center gap-1 font-bold">
                  <Key className="w-3 h-3" />
                  Security Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-[#E0FBFC]/50 border border-[#C2DFE3] rounded px-3.5 py-2.5 text-xs text-[#253237] placeholder-[#9DB4C0] focus:outline-none focus:border-[#5C6B73] transition-colors font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 bg-[#253237] hover:bg-[#5C6B73] text-white font-sans text-xs tracking-widest font-bold py-3.5 rounded-lg disabled:opacity-50 transition-all shadow-luxury-md"
              >
                {loading ? "AUTHENTICATING..." : "ENTER CONSOLE"}
              </button>
            </form>
          ) : (
            /* 2FA Form */
            <form onSubmit={handle2FAVerify} className="flex flex-col gap-5 font-sans">
              <div className="bg-[#E0FBFC]/60 border border-[#C2DFE3] p-4 rounded-xl text-center mb-2">
                <Lock className="w-6 h-6 mx-auto mb-2 text-[#5C6B73]" />
                <p className="text-[11px] font-bold text-[#253237] uppercase font-sans">Two-Factor Authentication</p>
                <p className="text-[10px] text-[#5C6B73] mt-1 font-sans">Please enter the 6-digit code from your authenticator application.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono text-[#5C6B73] uppercase font-bold">
                  Authentication Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="bg-[#E0FBFC]/50 border border-[#C2DFE3] rounded px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-[#253237] focus:outline-none focus:border-[#5C6B73] transition-colors font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="mt-2 bg-[#253237] hover:bg-[#5C6B73] text-white font-sans text-xs tracking-widest font-bold py-3.5 rounded-lg disabled:opacity-50 transition-all shadow-luxury-md"
              >
                {loading ? "VERIFYING SECURE KEY..." : "VALIDATE & ENTER"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShow2FA(false);
                  setOtpCode("");
                }}
                className="text-[10px] font-sans text-[#5C6B73] hover:text-[#253237] text-center uppercase tracking-wider font-bold"
              >
                Cancel and return
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-[9px] font-sans text-[#5C6B73] leading-relaxed font-bold">
            © {new Date().getFullYear()} ORIVENCE SURGICAL. All rights reserved.
          </div>

        </div>
      </div>
    </div>
  );
}
