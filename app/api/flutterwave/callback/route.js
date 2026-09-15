import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendRegistrationEmail } from "@/lib/email";

export async function GET(req) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const { searchParams } = new URL(req.url);
    const transaction_id = searchParams.get("transaction_id");
    const status = searchParams.get("status");
    const tx_ref = searchParams.get("tx_ref");

    // Handle immediate cancellation or missing transaction ID
    if (status === "cancelled" || !transaction_id) {
      const failedUrl = transaction_id
        ? `/payment-failed?transaction_id=${transaction_id}`
        : "/payment-failed";
      return NextResponse.redirect(new URL(failedUrl, baseUrl));
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
      return NextResponse.redirect(
        new URL(`/payment-failed?transaction_id=${transaction_id}`, baseUrl),
      );
    }

    const gatewayTxRef = result.data.tx_ref || tx_ref;

    // Find registration record
    const [rows] = await pool.query(
      `
      SELECT *
      FROM registrations
      WHERE tx_ref = ? OR transaction_id = ?
      LIMIT 1
      `,
      [gatewayTxRef, transaction_id],
    );

    if (!rows.length) {
      return NextResponse.redirect(
        new URL(`/payment-failed?transaction_id=${transaction_id}`, baseUrl),
      );
    }

    const registration = rows[0];

    // Validate amount, currency, and status
    const paymentValid =
      result.data.status === "successful" &&
      Number(result.data.amount) >= Number(registration.amount) &&
      result.data.currency === "NGN";

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
        WHERE id = ?
        `,
        [
          transaction_id,
          result.data.status,
          result.message || "Payment verified successfully",
          "Payment verified successfully",
          registration.id,
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

      return NextResponse.redirect(
        new URL(`/payment-success?transaction_id=${transaction_id}`, baseUrl),
      );
    }

    // Mark failed in database
    await pool.query(
      `
      UPDATE registrations
      SET
        payment_status = 'FAILED',
        transaction_id = ?,
        flutterwave_status = ?,
        flutterwave_message = ?,
        message = ?
      WHERE id = ?
      `,
      [
        transaction_id,
        result.data.status || "failed",
        result.message || "Verification failed",
        "Payment verification failed",
        registration.id,
      ],
    );

    return NextResponse.redirect(
      new URL(`/payment-failed?transaction_id=${transaction_id}`, baseUrl),
    );
  } catch (error) {
    console.error("Verification Error:", error);
    const { searchParams } = new URL(req.url);
    const transaction_id = searchParams.get("transaction_id");

    const failedUrl = transaction_id
      ? `/payment-failed?transaction_id=${transaction_id}`
      : "/payment-failed";

    return NextResponse.redirect(new URL(failedUrl, baseUrl));
  }
}
