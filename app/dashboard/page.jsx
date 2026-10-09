"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Shield, Activity, Award, LogOut, ArrowRight } from "lucide-react";

export default function NextDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/dashboard/user");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#24000a] text-[#f6e6ce]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#800021] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const profile = data?.profile || {};
  const stats = data?.stats || {};
  const tasks = data?.tasks || [];
  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-[#24000a] text-[#f6e6ce] px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Admin Bar */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-between text-xs sm:text-sm font-semibold">
            <span>You have Administrator access.</span>
            <Link href="/admin" className="px-3.5 py-1.5 rounded-xl bg-[#800021] text-[#f6e6ce] font-bold">
              Open Admin Console →
            </Link>
          </div>
        )}

        {/* Top Header Card */}
        <div className="p-8 rounded-3xl bg-[#800021]/15 border border-[#800021]/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Status: {profile.status === "active" ? "Active" : profile.status}</span>
            </div>
            <h1 className="text-3xl font-black">Welcome, {profile.fullname}!</h1>
            <p className="text-xs text-[#f6e6ce]/70 mt-1">
              @{profile.username} • {profile.email} • Plan: {profile.plan} (Free)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#800021]/15 border border-[#800021]/40">
            <span className="text-[10px] font-bold uppercase opacity-70">Current Tier</span>
            <p className="text-2xl font-black text-[#f6e6ce] mt-2">{profile.plan || "Free"}</p>
            <p className="text-xs text-[#f6e6ce]/60 mt-0.5">Free Contributor</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#800021]/15 border border-[#800021]/40">
            <span className="text-[10px] font-bold uppercase opacity-70">Hourly Rate</span>
            <p className="text-2xl font-black text-[#f6e6ce] mt-2">{stats.hourlyRate || "$8.6 / hr"}</p>
            <p className="text-xs text-[#f6e6ce]/60 mt-0.5">Verified</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#800021]/15 border border-[#800021]/40">
            <span className="text-[10px] font-bold uppercase opacity-70">Accuracy Score</span>
            <p className="text-2xl font-black text-[#f6e6ce] mt-2">{stats.accuracyScore || "99.4%"}</p>
            <p className="text-xs text-[#f6e6ce]/60 mt-0.5">Neural Evaluation</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#800021]/15 border border-[#800021]/40">
            <span className="text-[10px] font-bold uppercase opacity-70">Aligned Nodes</span>
            <p className="text-2xl font-black text-[#f6e6ce] mt-2">{stats.completedNodes || 12}</p>
            <p className="text-xs text-[#f6e6ce]/60 mt-0.5">Synced to Network</p>
          </div>
        </div>

        {/* Available Tasks */}
        <div className="p-6 rounded-3xl bg-[#800021]/15 border border-[#800021]/40 space-y-4">
          <h2 className="text-lg font-bold">Active Training Tasks</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-[#24000a]/60 border border-[#800021]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-mono opacity-60">{task.id}</span>
                  <h3 className="text-sm font-bold">{task.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-[#f6e6ce]">{task.reward}</span>
                  <button
                    onClick={() => alert(`Node ${task.id} started.`)}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#800021] hover:bg-[#9a0028]"
                  >
                    Start Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
