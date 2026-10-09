import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const adminUser = await getAuthUser(req);

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Administrator access required." },
        { status: 403 },
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const [rows] = await pool.query(
      `SELECT id, fullname, username, email, phone, role, plan, amount, tx_ref, transaction_id, payment_status, status, message, created_at 
       FROM registrations 
       WHERE id = ? 
       LIMIT 1`,
      [userId],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("Admin Get User Error:", error);
    return NextResponse.json(
      { success: false, message: "Error loading user details." },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const adminUser = await getAuthUser(req);

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Administrator access required." },
        { status: 403 },
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Load target user from SQL
    const [targetRows] = await pool.query(
      `SELECT id, email, role, status FROM registrations WHERE id = ? LIMIT 1`,
      [userId],
    );

    if (targetRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    const targetUser = targetRows[0];
    const isPrimaryAdmin =
      targetUser.email.toLowerCase() ===
      (process.env.ADMIN_EMAIL || "chiplugtv@gmail.com").toLowerCase();

    const body = await req.json();
    const { status, role } = body;

    // Prevent suspending or demoting primary admin
    if (isPrimaryAdmin) {
      if (status === "suspended") {
        return NextResponse.json(
          {
            success: false,
            message: "Action rejected: Cannot suspend the primary administrator account.",
          },
          { status: 400 },
        );
      }
      if (role && role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            message: "Action rejected: Cannot revoke administrator role from primary admin.",
          },
          { status: 400 },
        );
      }
    }

    const updates = [];
    const updateParams = [];

    if (status && ["active", "suspended", "pending"].includes(status)) {
      updates.push("status = ?");
      updateParams.push(status);
    }

    if (role && ["user", "admin"].includes(role)) {
      updates.push("role = ?");
      updateParams.push(role);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields to update." },
        { status: 400 },
      );
    }

    updateParams.push(userId);
    await pool.query(
      `UPDATE registrations SET ${updates.join(", ")} WHERE id = ?`,
      updateParams,
    );

    // Also sync to users table if record exists
    if (targetUser.email) {
      const userUpdates = [];
      const userParams = [];
      if (status && ["active", "suspended"].includes(status)) {
        userUpdates.push("status = ?");
        userParams.push(status);
      }
      if (role && ["user", "admin"].includes(role)) {
        userUpdates.push("role = ?");
        userParams.push(role);
      }
      if (userUpdates.length > 0) {
        userParams.push(targetUser.email);
        await pool.query(
          `UPDATE users SET ${userUpdates.join(", ")} WHERE email = ?`,
          userParams,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "User account updated successfully.",
      updatedFields: { status, role },
    });
  } catch (error) {
    console.error("Admin Update User Error:", error);
    return NextResponse.json(
      { success: false, message: "Error updating user account." },
      { status: 500 },
    );
  }
}
