import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { sendRegistrationEmail } from "../../../lib/email";

export async function GET(req) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const { searchParams } = new URL(req.url);

    const transaction_id = searchParams.get("transaction_id");

    // No transaction ID
    if (!transaction_id) {
      return NextResponse.redirect(new URL("/payment-failed", baseUrl));
    }

    // Verify payment with Flutterwave
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const result = await verifyRes.json();

    // Verification request failed
    if (!result || result.status !== "success" || !result.data) {
      return NextResponse.redirect(new URL("/payment-failed", baseUrl));
    }

    const tx_ref = result.data.tx_ref;

    // Find registration
    const [rows] = await pool.query(
      `
      SELECT *
      FROM registrations
      WHERE tx_ref = ?
      LIMIT 1
      `,
      [tx_ref],
    );

    if (!rows.length) {
      return NextResponse.redirect(new URL("/payment-failed", baseUrl));
    }

    const registration = rows[0];

    // Verify amount and payment status
    const paymentValid =
      result.data.status === "successful" &&
      Number(result.data.amount) >= Number(registration.amount);

    if (paymentValid) {
      await pool.query(
        `
        UPDATE registrations
        SET
          payment_status = 'PAID',
          transaction_id = ?,
          flutterwave_status = ?,
          flutterwave_message = ?,
          message = ?
        WHERE tx_ref = ?
        `,
        [
          transaction_id,
          result.data.status,
          result.message || "Payment verified",
          "Payment verified successfully",
          tx_ref,
        ],
      );

      try {
        await sendRegistrationEmail({
          ...registration,
          transaction_id,
          payment_status: "PAID",
        });
      } catch (emailError) {
        console.error("Email Error:", emailError);
      }

      return NextResponse.redirect(new URL("/payment-success", baseUrl));
    }

    // Mark failed
    await pool.query(
      `
      UPDATE registrations
      SET
        payment_status = 'FAILED',
        transaction_id = ?,
        flutterwave_status = ?,
        flutterwave_message = ?,
        message = ?
      WHERE tx_ref = ?
      `,
      [
        transaction_id,
        result.data.status || "failed",
        result.message || "Verification failed",
        "Payment verification failed",
        tx_ref,
      ],
    );

    return NextResponse.redirect(new URL("/payment-failed", baseUrl));
  } catch (error) {
    console.error("Verification Error:", error);

    return NextResponse.redirect(new URL("/payment-failed", baseUrl));
  }
}
