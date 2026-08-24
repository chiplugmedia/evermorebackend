import Link from "next/link";

export default function PaymentFailed() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-red-50 px-5">
      <div className="max-w-lg w-full bg-white p-10 rounded-3xl shadow-xl text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-red-600 text-5xl">✕</span>
        </div>

        <h1 className="mt-6 text-4xl font-black text-red-600">
          Payment Failed
        </h1>

        <p className="mt-4 text-slate-600">
          Your payment could not be verified.
        </p>

        <Link
          href="/register"
          className="
          mt-8
          inline-flex
          items-center
          justify-center
          px-8
          py-4
          rounded-2xl
          font-semibold
          text-white
          bg-gradient-to-r
          from-[#0E2258]
          via-[#15347A]
          to-[#0F9AC5]
          "
        >
          Try Again
        </Link>
      </div>
    </main>
  );
}
