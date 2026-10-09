import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import bcrypt from "bcryptjs";
import { createSessionToken, getSetCookieHeader } from "../../../lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();

    const { fullname, phone, email, plan = "Free", password } = body;

    // Validation
    if (!fullname || !phone || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = cleanEmail.split("@")[0].replace(/[^a-z0-9_]/g, "");

    // Check existing email
    const [existing] = await pool.query(
      `SELECT id FROM registrations WHERE LOWER(email)=? LIMIT 1`,
      [cleanEmail],
    );

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already registered. Please log in.",
        },
        { status: 400 },
      );
    }

    const isFree = !plan || plan === "Free";
    const amount = isFree ? 0 : plan === "Premium" ? 14000 : 7000;
    const tx_ref = `${isFree ? "FREE" : "EVER"}-${Date.now()}-${Math.floor(Math.random() * 999999)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const initialStatus = isFree ? "FREE" : "PENDING";
    const initialMsg = isFree ? "Free Contributor Account" : "Waiting for payment";

    // Save Registration
    const [insertResult] = await pool.query(
      `
      INSERT INTO registrations
      (
        fullname,
        username,
        phone,
        email,
        role,
        plan,
        password,
        amount,
        tx_ref,
        payment_status,
        status,
        message,
        created_at
      )
      VALUES
      (
        ?, ?, ?, ?, 'user', ?, ?, ?, ?,
        ?,
        'active',
        ?,
        NOW()
      )
      `,
      [
        fullname.trim(),
        cleanUsername,
        phone.trim(),
        cleanEmail,
        isFree ? "Free" : plan,
        hashedPassword,
        amount,
        tx_ref,
        initialStatus,
        initialMsg,
      ],
    );

    const newUserId = insertResult.insertId;

    // If Free registration, auto-login immediately without Flutterwave
    if (isFree) {
      const token = createSessionToken({
        userId: newUserId,
        email: cleanEmail,
        username: cleanUsername,
        role: "user",
      });

      const response = NextResponse.json({
        success: true,
        message: "Free registration complete! Welcome to QuickMuse.",
        user: {
          id: newUserId,
          fullname,
          username: cleanUsername,
          email: cleanEmail,
          phone,
          role: "user",
          plan: "Free",
          status: "active",
        },
        token,
        redirect: "/dashboard",
      });

      response.headers.set("Set-Cookie", getSetCookieHeader(token));
      return response;
    }

    // Otherwise, generate Flutterwave payment link for paid plan upgrade
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const flutterwaveRes = await fetch(
      "https://api.flutterwave.com/v3/payments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref,
          amount,
          currency: "NGN",
          redirect_url: `${baseUrl}/api/verify-payment`,
          customer: {
            email: cleanEmail,
            phonenumber: phone,
            name: fullname,
          },
          customizations: {
            title: "QuickMuse Subscription",
            description: `${plan} Plan Upgrade`,
            logo: `${baseUrl}/logo.png`,
          },
        }),
      },
    );

    const data = await flutterwaveRes.json();

    if (data.status !== "success" || !data.data?.link) {
      await pool.query(
        `
        UPDATE registrations
        SET
        payment_status='FAILED',
        flutterwave_message=?,
        message=?
        WHERE tx_ref=?
        `,
        [
          data.message || "Payment link failed",
          "Flutterwave failed to generate payment link",
          tx_ref,
        ],
      );

      return NextResponse.json(
        {
          success: false,
          message: data.message || "Unable to generate payment link",
        },
        { status: 400 },
      );
    }

    await pool.query(
      `
      UPDATE registrations
      SET
      flutterwave_message=?,
      message=?
      WHERE tx_ref=?
      `,
      [
        data.message || "Payment link created",
        "Redirecting user to Flutterwave",
        tx_ref,
      ],
    );

    return NextResponse.json({
      success: true,
      link: data.data.link,
      tx_ref,
      amount,
    });
  } catch (error) {
    console.error("Create Payment Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
