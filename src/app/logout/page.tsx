// src/app/logout/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (e) {
        console.error("Logout request error:", e);
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
      }
      router.replace("/admin/login");
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-white px-4">
      <div className="text-center space-y-4 max-w-md w-full">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white tracking-wide">Signing Out</h2>
          <p className="text-slate-400 text-sm font-light">
            Logging out of ORIVENCE Master Control Center...
          </p>
        </div>
      </div>
    </div>
  );
}
