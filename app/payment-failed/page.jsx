"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, AlertTriangle, AlertCircle } from "lucide-react";

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const transactionId =
    searchParams.get("transaction_id") || searchParams.get("id");

  const supportTelegramUrl = transactionId
    ? `https://t.me/Evermorenet_ai_agent?text=${encodeURIComponent(
        `Hello Evermorenet AI Agent,\n\nMy payment failed. Here is my Transaction ID:\n• Transaction ID: ${transactionId}\n\nPlease help me resolve this.`,
      )}`
    : "https://t.me/Evermorenet_ai_agent";

  return (
    <>
      <div className="mt-8 space-y-3 rounded-3xl border border-red-100 bg-red-50/50 p-6 text-left">
        {transactionId && (
          <div className="flex items-center justify-between border-b border-red-100 pb-2 text-sm">
            <span className="font-medium text-slate-500">Transaction ID</span>
            <span className="font-mono font-bold text-red-600">
              {transactionId}
            </span>
          </div>
        )}

        <p className="flex items-start gap-3 text-sm text-slate-700">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="size-3" />
          </span>
          <span>
            <strong className="text-[#0E2258]">Verification Failed</strong> —
            Payment gateway could not confirm funds
          </span>
        </p>

        <p className="flex items-start gap-3 text-sm text-slate-700">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="size-3" />
          </span>
          <span>
            <strong className="text-[#0E2258]">Common Issues</strong> — Check
            card balance or network connectivity
          </span>
        </p>

        <p className="flex items-start gap-3 text-sm text-slate-700">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="size-3" />
          </span>
          <span>
            <strong className="text-[#0E2258]">Activation Blocked</strong> — Try
            standard or boosted tier again
          </span>
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <Link
          href="https://evermorenetwork.com/register"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0E2258] via-[#15347A] to-[#0F9AC5] text-base font-bold text-white shadow-lg shadow-[#0F9AC5]/20 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-[#0F9AC5]/30 active:scale-[0.99] sm:h-[3.25rem]"
        >
          Try Activation Again
          <Zap className="h-5 w-5" />
        </Link>

      </div>
    </>
  );
}

export default function PaymentFailed() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fafc] px-5 py-20">
      <div className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[#0F9AC5]/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-red-500/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-2xl shadow-gray-200/50 md:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
          <AlertTriangle className="h-10 w-10" />
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#0E2258] sm:text-4xl md:text-5xl">
          Transaction <span className="text-red-500">Interrupted.</span>
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          We were unable to verify your membership activation payment. Please
          review the details below.
        </p>

        <Suspense fallback={<p className="mt-5 text-slate-500">Loading...</p>}>
          <PaymentFailedContent />
        </Suspense>

        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-slate-400">
          Jovia Network Ecosystem · Secure Verification
        </p>
      </div>
    </main>
  );
}
