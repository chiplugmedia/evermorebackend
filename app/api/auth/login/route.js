import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  comparePassword,
  createSessionToken,
  getSetCookieHeader,
} from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !identifier.trim() || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your username/email and password.",
        },
        { status: 400 },
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Query registrations table by email OR username
    const [rows] = await pool.query(
      `SELECT id, fullname, username, email, phone, role, plan, password, status, payment_status, created_at 
       FROM registrations 
       WHERE LOWER(email) = ? OR LOWER(username) = ? 
       ORDER BY id DESC`,
      [cleanIdentifier, cleanIdentifier],
    );

    let matchedUser = null;

    if (rows.length > 0) {
      // Find the account where password matches
      for (const candidate of rows) {
        if (candidate.password) {
          const isMatch = await comparePassword(password, candidate.password);
          if (isMatch) {
            matchedUser = candidate;
            break;
          }
        }
      }
    }

    // If not found in registrations, check users table fallback
    if (!matchedUser) {
      const [userRows] = await pool.query(
        `SELECT id, fullname, username, email, phone, role, plan, password, status, payment_status, created_at 
         FROM users 
         WHERE LOWER(email) = ? OR LOWER(username) = ? 
         ORDER BY id DESC`,
        [cleanIdentifier, cleanIdentifier],
      );

      for (const candidate of userRows) {
        if (candidate.password) {
          const isMatch = await comparePassword(password, candidate.password);
          if (isMatch) {
            matchedUser = candidate;
            break;
          }
        }
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials. Please check your username/email and password.",
        },
        { status: 401 },
      );
    }

    // Check account status
    if (matchedUser.status === "suspended") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been suspended. Please contact support for assistance.",
        },
        { status: 403 },
      );
    }

    // Identify and preserve administrator role
    let effectiveRole = matchedUser.role || "user";
    if (
      process.env.ADMIN_EMAIL &&
      matchedUser.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    ) {
      effectiveRole = "admin";
    }

    // Create session token
    const tokenPayload = {
      userId: matchedUser.id,
      email: matchedUser.email,
      username: matchedUser.username,
      role: effectiveRole,
    };

    const token = createSessionToken(tokenPayload);
    const cookieHeader = getSetCookieHeader(token);

    const redirectUrl = effectiveRole === "admin" ? "/admin" : "/dashboard";

    const userResponse = {
      id: matchedUser.id,
      fullname: matchedUser.fullname,
      username: matchedUser.username,
      email: matchedUser.email,
      phone: matchedUser.phone,
      role: effectiveRole,
      plan: matchedUser.plan || "Free",
      status: matchedUser.status || "active",
      created_at: matchedUser.created_at,
    };

    const response = NextResponse.json({
      success: true,
      message: "Login successful!",
      user: userResponse,
      token,
      redirect: redirectUrl,
    });

    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during login. Please try again.",
      },
      { status: 500 },
    );
  }
}
