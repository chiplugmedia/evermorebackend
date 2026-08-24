import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();

    const { fullname, phone, email, plan, password } = body;

    // Validation
    if (!fullname || !phone || !email || !password || !plan) {
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

    // Check existing email
    // const [existing] = await pool.query(
    //   `
    //   SELECT id
    //   FROM registrations
    //   WHERE email=?
    //   LIMIT 1
    //   `,
    //   [email],
    // );

    // if (existing.length > 0) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: "Email already registered",
    //     },
    //     { status: 400 },
    //   );
    // }

    // Plan Amount
    const amount = plan === "Premium" ? 14000 : 7000;

    const tx_ref = `EVER-${Date.now()}-${Math.floor(Math.random() * 999999)}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save Registration First
    await pool.query(
      `
      INSERT INTO registrations
      (
        fullname,
        phone,
        email,
        plan,
        password,
        amount,
        tx_ref,
        payment_status,
        message
      )
      VALUES
      (
        ?, ?, ?, ?, ?, ?, ?,
        'PENDING',
        'Waiting for payment'
      )
      `,
      [fullname, phone, email, plan, hashedPassword, amount, tx_ref],
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Flutterwave Request
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
            email,
            phonenumber: phone,
            name: fullname,
          },

          customizations: {
            title: "Evermore Subscription",
            description: `${plan} Plan Subscription`,
            logo: `${baseUrl}/logo.png`,
          },
        }),
      },
    );

    const data = await flutterwaveRes.json();

    // Flutterwave Error
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

    // Save Flutterwave Message
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
