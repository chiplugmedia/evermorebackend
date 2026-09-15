"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const transactionId =
    searchParams.get("transaction_id") || searchParams.get("id");

  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/transactions/${transactionId}`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server API Error Response:", errorData);
          throw new Error(errorData.error || "Transaction not found");
        }

        const data = await response.json();
        setPaymentDetails(data);
      } catch (err) {
        console.error("Error fetching transaction details:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  useEffect(() => {
    if (!paymentDetails) return;

    const sendTelegramNotification = async () => {
      const botToken = "YOUR_TELEGRAM_BOT_TOKEN";
      const chatId = "@Evermorenet_ai_agent";

      const message = `
🎉 *Payment Confirmed!*

📋 *Transaction Details:*
• *Plan:* ${paymentDetails.plan || "N/A"}
• *Transaction ID:* ${transactionId}
• *Amount Paid:* ${paymentDetails.amount || "N/A"}
• *Date:* ${new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
• *Status:* Verified ✓
      `;

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
          }),
        });
      } catch (err) {
        console.error("Failed to send automatic Telegram message:", err);
      }
    };

    sendTelegramNotification();
  }, [paymentDetails, transactionId]);

  const supportTelegramUrl = transactionId
    ? `https://t.me/Evermorenet_ai_agent?text=${encodeURIComponent(
        `Hello Evermorenet AI Agent,\n\nI just completed a payment with the following details:\n\n• Plan: ${
          paymentDetails?.plan || "N/A"
        }\n• Transaction ID: ${transactionId}\n• Amount: ${
          paymentDetails?.amount || "N/A"
        }`,
      )}`
    : "https://t.me/Evermorenet_ai_agent";

  if (loading) {
    return (
      <div className="text-center py-10 text-slate-500 font-medium">
        Loading transaction details...
      </div>
    );
  }

  if (error || !transactionId) {
    return (
      <div className="text-center py-10 text-red-500 font-medium">
        Unable to load transaction. Invalid or missing Transaction ID.
      </div>
    );
  }

  return (
    <>
      <p className="mt-5 text-lg text-slate-600 max-w-sm mx-auto leading-relaxed">
        Awesome! Your transaction was verified successfully. Your account is now
        active.
      </p>

      <div className="mt-10 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-left space-y-3">
        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
          Transaction Summary
        </p>

        {paymentDetails?.plan && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Plan</span>
            <span className="text-[#0E2258] font-semibold">
              {paymentDetails.plan}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Transaction ID</span>
          <span className="font-mono text-[#0E2258] font-medium">
            {transactionId}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Date</span>
          <span className="text-[#0E2258] font-medium">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {paymentDetails?.amount && (
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
            <span className="text-slate-700 font-semibold">Amount Paid</span>
            <span className="text-green-600 font-bold text-lg">
              {paymentDetails.amount}
            </span>
          </div>
        )}
      </div>

      <Link
        href={supportTelegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative mt-10 inline-flex items-center justify-center w-full sm:w-auto px-12 py-4 rounded-full font-bold text-lg text-white bg-gradient-to-r from-[#0E2258] via-[#15347A] to-[#0F9AC5] shadow-lg shadow-[#0F9AC5]/20 transition-all duration-300 ease-out hover:shadow-xl hover:shadow-[#0F9AC5]/30 hover:scale-105 active:scale-100 group"
      >
        Contact Jovia Support
        <span className="ml-3 group-hover:translate-x-1 transition-transform duration-300">
          →
        </span>
      </Link>
    </>
  );
}

export default function PaymentSuccess() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#f8fafc] px-5 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#0F9AC5]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#0E2258]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full bg-white p-8 md:p-12 rounded-[32px] shadow-2xl shadow-gray-100 text-center border border-gray-100 animate-fade-in-up">
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center animate-pop-in">
          <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse-slow" />
          <div className="relative w-20 h-20 rounded-3xl bg-white/60 backdrop-blur-sm border border-white shadow-xl shadow-green-100 flex items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-green-50/50" />
            <span className="relative text-green-600 text-6xl font-black leading-none mt-1">
              ✓
            </span>
          </div>
          <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        </div>

        <h1 className="mt-8 text-4xl md:text-5xl font-extrabold text-[#0E2258] tracking-tight leading-tight">
          Payment <span className="text-[#0F9AC5]">Confirmed!</span>
        </h1>

        <Suspense fallback={<p className="mt-5 text-slate-500">Loading...</p>}>
          <PaymentSuccessContent />
        </Suspense>
      </div>
    </main>
  );
}
