import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in to view your dashboard." },
        { status: 401 },
      );
    }

    // Dynamic stats and configuration tailored to the user's plan
    const isPremium = user.plan === "Premium";
    const hourlyRate = isPremium ? "$18.6 / hr" : "$8.6 / hr";
    const tierName = isPremium
      ? "Premium Contributor"
      : user.plan === "Trial"
      ? "Trial Contributor"
      : "Free Contributor";

    const dashboardData = {
      profile: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        plan: user.plan || "Free",
        tierName,
        status: user.status || "active",
        joinedDate: user.created_at,
      },
      stats: {
        hourlyRate,
        accuracyScore: "99.4%",
        completedNodes: 12,
        activeModelsAssigned: 3,
        networkSyncStatus: "Live & Synced",
        accountTier: tierName,
        accountStatus: user.status === "active" ? "Operational" : "Suspended",
      },
      tasks: [
        {
          id: "TASK-101",
          title: "Memory Node Alignment: Transformer Recall",
          reward: "$4.30",
          status: "Available",
          difficulty: "Standard",
        },
        {
          id: "TASK-102",
          title: "Prompt Coherence Evaluation: Dialogue Stream",
          reward: "$6.20",
          status: "In Progress",
          difficulty: "Intermediate",
        },
        {
          id: "TASK-103",
          title: "Synthetic Dialogue Human Refinement",
          reward: "$8.50",
          status: "Available",
          difficulty: "Standard",
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("User Dashboard API Error:", error);
    return NextResponse.json(
      { success: false, message: "Error loading dashboard details." },
      { status: 500 },
    );
  }
}
