import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#24000a] text-[#f6e6ce] px-6 py-12">
      <div className="max-w-xl w-full text-center space-y-8 bg-[#800021]/15 border border-[#800021]/40 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#800021]/50 bg-[#800021]/20 px-4 py-1.5 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>QuickMuse AI Contributor Ecosystem</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
          Next-Gen Memory <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f6e6ce] via-[#e5989b] to-[#800021]">
            Neural Network
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[#f6e6ce]/80 max-w-md mx-auto leading-relaxed">
          Free public onboarding is now active. Train memory nodes, evaluate prompts, and earn rewards.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-[#800021] text-[#f6e6ce] hover:bg-[#9a0028] shadow-lg shadow-[#800021]/30 transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Register for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm border border-[#800021]/40 hover:bg-[#800021]/20 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-[#800021]/30 flex items-center justify-center gap-6 text-xs text-[#f6e6ce]/60 font-mono">
          <Link href="/dashboard" className="hover:underline">
            User Dashboard
          </Link>
          <span>•</span>
          <Link href="/admin" className="hover:underline">
            Admin Console
          </Link>
        </div>
      </div>
    </div>
  );
}
