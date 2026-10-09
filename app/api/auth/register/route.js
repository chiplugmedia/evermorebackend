import { NextResponse } from "next/server";
import pool from "@/lib/db";
import {
  hashPassword,
  createSessionToken,
  getSetCookieHeader,
} from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      fullname,
      username,
      email,
      phone,
      password,
      confirmPassword,
    } = body;

    // 1. Server-side validation
    if (!fullname || !fullname.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name is required." },
        { status: 400 },
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email address is required." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: "Phone number is required." },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long.",
        },
        { status: 400 },
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match." },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanFullname = fullname.trim();
    // Default username if not provided or clean it
    const cleanUsername = username && username.trim()
      ? username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
      : cleanEmail.split("@")[0].replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message: "Username must be at least 3 alphanumeric characters.",
        },
        { status: 400 },
      );
    }

    // 2. Check Uniqueness in SQL
    // Check email uniqueness
    const [existingEmail] = await pool.query(
      `SELECT id FROM registrations WHERE LOWER(email) = ? LIMIT 1`,
      [cleanEmail],
    );

    if (existingEmail.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email address already exists. Please log in.",
        },
        { status: 409 },
      );
    }

    // Check username uniqueness
    const [existingUsername] = await pool.query(
      `SELECT id FROM registrations WHERE LOWER(username) = ? LIMIT 1`,
      [cleanUsername],
    );

    if (existingUsername.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This username is already taken. Please choose another username.",
        },
        { status: 409 },
      );
    }

    // 3. Hash Password securely (Bcrypt)
    const hashedPassword = await hashPassword(password);

    // 4. Server-enforced defaults (Never trust browser-supplied role or privileges)
    const role = "user"; // Public registrations are ALWAYS ordinary users
    const plan = "Free"; // Default free starter contributor plan
    const amount = 0.0;
    const payment_status = "FREE";
    const status = "active";
    const tx_ref = `FREE-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
    const message = "Free Contributor Registration";

    // 5. Store in SQL database using Transaction
    const connection = await pool.getConnection();
    let newUserId;

    try {
      await connection.beginTransaction();

      const [regResult] = await connection.query(
        `INSERT INTO registrations (
          fullname, username, phone, email, role, plan, password, amount, tx_ref,
          payment_status, status, message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          cleanFullname,
          cleanUsername,
          cleanPhone,
          cleanEmail,
          role,
          plan,
          hashedPassword,
          amount,
          tx_ref,
          payment_status,
          status,
          message,
        ],
      );

      newUserId = regResult.insertId;

      // Sync into users table if table exists
      await connection.query(
        `INSERT IGNORE INTO users (
          id, fullname, username, phone, email, role, plan, password, amount,
          payment_status, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          newUserId,
          cleanFullname,
          cleanUsername,
          cleanPhone,
          cleanEmail,
          role,
          plan,
          hashedPassword,
          amount,
          "free",
          status,
        ],
      );

      await connection.commit();
    } catch (dbErr) {
      await connection.rollback();
      throw dbErr;
    } finally {
      connection.release();
    }

    // 6. Automatic Login: Establish authenticated session
    const tokenPayload = {
      userId: newUserId,
      email: cleanEmail,
      username: cleanUsername,
      role,
    };

    const token = createSessionToken(tokenPayload);
    const cookieHeader = getSetCookieHeader(token);

    const userResponse = {
      id: newUserId,
      fullname: cleanFullname,
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      role,
      plan,
      status,
      created_at: new Date().toISOString(),
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful! Welcome to QuickMuse.",
        user: userResponse,
        token,
        redirect: "/dashboard",
      },
      { status: 201 },
    );

    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  } catch (error) {
    console.error("Free Registration Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to complete registration. Please try again later.",
      },
      { status: 500 },
    );
  }
}
