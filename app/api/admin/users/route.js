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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const plan = searchParams.get("plan")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    let sql = `
      SELECT id, fullname, username, email, phone, role, plan, amount, payment_status, status, created_at 
      FROM registrations 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (LOWER(fullname) LIKE ? OR LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)`;
      const searchWildcard = `%${search.toLowerCase()}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, `%${search}%`);
    }

    if (plan && plan !== "all") {
      sql += ` AND plan = ?`;
      params.push(plan);
    }

    if (status && status !== "all") {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY id DESC LIMIT 100`;

    const [users] = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching registered users." },
      { status: 500 },
    );
  }
}
