import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const adminUser = await getAuthUser(req);

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Administrator access required." },
        { status: 403 },
      );
    }

    // 1. Total counts from SQL database
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM registrations`,
    );
    const totalUsers = totalRows[0]?.total || 0;

    const [activeRows] = await pool.query(
      `SELECT COUNT(*) AS activeCount FROM registrations WHERE status = 'active'`,
    );
    const activeUsers = activeRows[0]?.activeCount || 0;

    const [suspendedRows] = await pool.query(
      `SELECT COUNT(*) AS suspendedCount FROM registrations WHERE status = 'suspended'`,
    );
    const suspendedUsers = suspendedRows[0]?.suspendedCount || 0;

    const [freeRows] = await pool.query(
      `SELECT COUNT(*) AS freeCount FROM registrations WHERE plan = 'Free' OR payment_status = 'FREE'`,
    );
    const freeUsers = freeRows[0]?.freeCount || 0;

    const [paidRows] = await pool.query(
      `SELECT COUNT(*) AS paidCount FROM registrations WHERE payment_status = 'PAID' OR plan IN ('Trial', 'Premium', 'Sliver')`,
    );
    const paidUsers = paidRows[0]?.paidCount || 0;

    // Plans breakdown
    const [planBreakdown] = await pool.query(
      `SELECT plan, COUNT(*) AS count FROM registrations GROUP BY plan`,
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        freeUsers,
        paidUsers,
        planBreakdown,
      },
    });
  } catch (error) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json(
      { success: false, message: "Error loading statistics from SQL database." },
      { status: 500 },
    );
  }
}
