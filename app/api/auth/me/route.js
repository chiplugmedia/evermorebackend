import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        plan: user.plan || "Free",
        status: user.status || "active",
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Auth Me API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
