import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const goals = await prisma.savingGoal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Fetch goals error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, targetAmount, currentAmount, deadline } = await req.json();

    if (!name || targetAmount === undefined) {
      return NextResponse.json({ message: "Name and targetAmount are required" }, { status: 400 });
    }

    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount || "0");

    if (isNaN(target) || target <= 0) {
      return NextResponse.json({ message: "Target amount must be a positive number" }, { status: 400 });
    }

    if (isNaN(current) || current < 0) {
      return NextResponse.json({ message: "Current amount cannot be negative" }, { status: 400 });
    }

    const goal = await prisma.savingGoal.create({
      data: {
        name,
        targetAmount: target,
        currentAmount: current,
        deadline: deadline ? new Date(deadline) : null,
        userId: session.user.id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Create goal error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
