import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool from "./db.js";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "quickmuse_secure_auth_secret_key_2026_x791";

const SESSION_COOKIE_NAME = "qm_session";
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Creates a base64url encoded string
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Decodes a base64url encoded string
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Creates a signed session token
 */
export function createSessionToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SECONDS;
  const tokenPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(dataToSign);
  const signature = base64UrlEncode(hmac.digest());

  return `${dataToSign}.${signature}`;
}

/**
 * Verifies a signed session token
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac("sha256", AUTH_SECRET);
  hmac.update(dataToSign);
  const expectedSignature = base64UrlEncode(hmac.digest());

  // Constant-time comparison
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts session token from Request (via Cookie or Authorization header)
 */
export function extractTokenFromRequest(req) {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // 2. Check Cookie header
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      }),
    );
    if (cookies[SESSION_COOKIE_NAME]) {
      return cookies[SESSION_COOKIE_NAME];
    }
  }

  return null;
}

/**
 * Authenticates request and loads live user from SQL database
 */
export async function getAuthUser(req) {
  const token = extractTokenFromRequest(req);
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || !payload.userId) return null;

  try {
    // Check registrations table first (where existing users live)
    const [rows] = await pool.query(
      `SELECT id, fullname, username, email, phone, role, plan, status, payment_status, created_at 
       FROM registrations 
       WHERE id = ? 
       LIMIT 1`,
      [payload.userId],
    );

    if (rows.length === 0) {
      // Check users table fallback
      const [userRows] = await pool.query(
        `SELECT id, fullname, username, email, phone, role, plan, status, payment_status, created_at 
         FROM users 
         WHERE id = ? 
         LIMIT 1`,
        [payload.userId],
      );
      if (userRows.length === 0) return null;
      const user = userRows[0];
      if (user.status === "suspended") return null;

      // Force admin role if email matches ADMIN_EMAIL
      if (process.env.ADMIN_EMAIL && user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
        user.role = "admin";
      }
      return user;
    }

    const user = rows[0];
    if (user.status === "suspended") return null;

    // Force admin role if email matches ADMIN_EMAIL
    if (process.env.ADMIN_EMAIL && user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
      user.role = "admin";
    }

    return user;
  } catch (err) {
    console.error("getAuthUser DB error:", err);
    return null;
  }
}

/**
 * Hash password securely
 */
export async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, 10);
}

/**
 * Compare password
 */
export async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generates Set-Cookie header string for session
 */
export function getSetCookieHeader(token) {
  const isProd = process.env.NODE_ENV === "production";
  const secureFlag = isProd ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_EXPIRY_SECONDS}${secureFlag}`;
}

/**
 * Generates Set-Cookie header string to clear session
 */
export function getClearCookieHeader() {
  const isProd = process.env.NODE_ENV === "production";
  const secureFlag = isProd ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureFlag}`;
}
