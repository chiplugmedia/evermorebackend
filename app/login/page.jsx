"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      return setError("Please provide your username/email and password.");
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials.");
      }

      router.push(data.redirect || "/dashboard");
    } catch (err) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#24000a] text-[#f6e6ce] px-4 py-12">
      <div className="w-full max-w-md bg-[#800021]/15 border border-[#800021]/40 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
        <div className="text-center pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-3.5 py-1 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Access</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Sign In</h1>
          <p className="text-xs text-[#f6e6ce]/70 mt-1.5">
            Log in to manage your AI contributor workspace or admin console.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              Email or Username
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="contributor@quickmuse.ai or username"
              className="w-full px-4 py-3 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-[#f6e6ce] placeholder-[#f6e6ce]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#800021]"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-[#f6e6ce] placeholder-[#f6e6ce]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#800021]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm text-[#f6e6ce] bg-[#800021] hover:bg-[#9a0028] shadow-lg shadow-[#800021]/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs opacity-80 pt-3">
            Don't have an account?{" "}
            <Link href="/register" className="font-bold underline text-[#f6e6ce]">
              Register for Free
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
