"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Users, CheckCircle, Ban, ArrowLeft } from "lucide-react";

export default function NextAdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadAdmin() {
      try {
        const statsRes = await fetch("/api/admin/stats");
        if (!statsRes.ok) {
          router.push("/dashboard");
          return;
        }
        const statsJson = await statsRes.json();
        if (statsJson.success) setStats(statsJson.stats);

        const usersRes = await fetch("/api/admin/users");
        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          if (usersJson.success) setUsers(usersJson.users);
        }
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadAdmin();
  }, [router]);

  const toggleStatus = async (user) => {
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    if (!window.confirm(`Update status of ${user.email} to ${nextStatus}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)),
        );
      } else {
        alert(data.message || "Failed to update.");
      }
    } catch {
      alert("Error updating user.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#24000a] text-[#f6e6ce]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#800021] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest">Checking Admin Credentials...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#24000a] text-[#f6e6ce] px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="p-8 rounded-3xl bg-[#800021]/15 border border-[#800021]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-3xl font-black">Platform User Management</h1>
            <p className="text-xs text-[#f6e6ce]/70 mt-1">
              Direct live connection to MySQL database records.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#800021]/30 hover:bg-[#800021]/10 flex items-center gap-1.5 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>User Dashboard</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#800021]/15 border border-[#800021]/40">
            <span className="text-[10px] font-bold uppercase opacity-70">Total Users</span>
            <p className="text-2xl font-black text-[#f6e6ce] mt-2">{stats?.totalUsers || users.length}</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#800021]/15 border border-[#800021]/40">
            <span className="text-[10px] font-bold uppercase opacity-70">Active Users</span>
            <p className="text-2xl font-black text-emerald-400 mt-2">{stats?.activeUsers || 0}</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#800021]/15 border border-[#800021]/40">
            <span className="text-[10px] font-bold uppercase opacity-70">Suspended Users</span>
            <p className="text-2xl font-black text-red-400 mt-2">{stats?.suspendedUsers || 0}</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#800021]/15 border border-[#800021]/40">
            <span className="text-[10px] font-bold uppercase opacity-70">Free Accounts</span>
            <p className="text-2xl font-black text-[#f6e6ce] mt-2">{stats?.freeUsers || 0}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="p-6 rounded-3xl bg-[#800021]/15 border border-[#800021]/40 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-bold">Registered Users in SQL ({filteredUsers.length})</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="px-3.5 py-1.5 rounded-xl bg-[#24000a]/80 border border-[#800021]/40 text-xs text-[#f6e6ce] placeholder-[#f6e6ce]/40"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase tracking-wider font-mono text-[10px] opacity-70 border-b border-[#800021]/30">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#800021]/20">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-mono">#{u.id}</td>
                    <td className="py-2.5 px-3 font-bold">{u.fullname}</td>
                    <td className="py-2.5 px-3 font-mono">@{u.username}</td>
                    <td className="py-2.5 px-3 font-mono">{u.email}</td>
                    <td className="py-2.5 px-3 uppercase font-bold">{u.role}</td>
                    <td className="py-2.5 px-3">{u.plan || "Free"}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === "suspended"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {u.status || "active"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            u.status === "suspended"
                              ? "bg-emerald-600 text-white"
                              : "bg-red-600/80 text-white"
                          }`}
                        >
                          {u.status === "suspended" ? "Activate" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
