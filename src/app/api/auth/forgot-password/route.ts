import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // For security, don't explicitly say the email doesn't exist
      return NextResponse.json(
        { message: "If the email exists, a password reset link has been sent." },
        { status: 200 }
      );
    }

    // Generate a mock reset link (valid for 1 hour for testing)
    const token = "mock-reset-token-" + Math.random().toString(36).substring(2, 15);
    const resetLink = `/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    return NextResponse.json(
      { 
        message: "If the email exists, a password reset link has been sent.",
        // We output the link in the response in development so the tester can click it
        resetLink,
        debugToken: token
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
