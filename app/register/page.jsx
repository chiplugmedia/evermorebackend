"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullname: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.fullname.trim() || !form.phone.trim() || !form.email.trim() || !form.password) {
      return setError("All fields are required.");
    }

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed.");
      }

      router.push(data.redirect || "/dashboard");
    } catch (err) {
      setError(err.message || "Error creating account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#24000a] text-[#f6e6ce] px-4 py-12">
      <div className="w-full max-w-md bg-[#800021]/15 border border-[#800021]/40 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">
        <div className="text-center pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-3.5 py-1 text-xs font-semibold mb-3">
            <Sparkles className="w-4 h-4" />
            <span>100% Free Public Registration</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Create Account</h1>
          <p className="text-xs text-[#f6e6ce]/70 mt-1.5">
            Instant free access to QuickMuse AI training nodes and rewards.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              Full Name
            </label>
            <input
              type="text"
              name="fullname"
              required
              value={form.fullname}
              onChange={handleChange}
              placeholder="Ada Lovelace"
              className="w-full px-4 py-2.5 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-[#f6e6ce] placeholder-[#f6e6ce]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#800021]"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="ada_lovelace"
              className="w-full px-4 py-2.5 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-[#f6e6ce] placeholder-[#f6e6ce]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#800021]"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              placeholder="+234 801 234 5678"
              className="w-full px-4 py-2.5 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-[#f6e6ce] placeholder-[#f6e6ce]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#800021]"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="contributor@quickmuse.ai"
              className="w-full px-4 py-2.5 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-[#f6e6ce] placeholder-[#f6e6ce]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#800021]"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-[#f6e6ce] placeholder-[#f6e6ce]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#800021]"
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

          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-[#f6e6ce] placeholder-[#f6e6ce]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#800021]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm text-[#f6e6ce] bg-[#800021] hover:bg-[#9a0028] shadow-lg shadow-[#800021]/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Creating Free Account...</span>
            ) : (
              <>
                <span>Register for Free</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs opacity-80 pt-3">
            Already have an account?{" "}
            <Link href="/login" className="font-bold underline text-[#f6e6ce]">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
