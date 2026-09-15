import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const { transaction_id } = resolvedParams;

    if (!transaction_id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    // Search by transaction_id OR tx_ref
    const [rows] = await pool.query(
      `
      SELECT *
      FROM registrations
      WHERE transaction_id = ? OR tx_ref = ?
      LIMIT 1
      `,
      [transaction_id, transaction_id],
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found in database" },
        { status: 404 },
      );
    }

    const reg = rows[0];

    return NextResponse.json({
      transactionId: reg.transaction_id || reg.tx_ref,
      amount: reg.amount ? `₦${reg.amount}` : "N/A",
      plan: reg.plan_name || reg.plan || reg.package || "Standard Plan",
      status: reg.payment_status || reg.status,
      date: reg.created_at,
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
