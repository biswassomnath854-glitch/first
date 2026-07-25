import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, targetAmount, currentAmount, deadline } = await req.json();

    if (!name || targetAmount === undefined) {
      return NextResponse.json({ message: "Name and targetAmount are required" }, { status: 400 });
    }

    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount);

    if (isNaN(target) || target <= 0) {
      return NextResponse.json({ message: "Target amount must be a positive number" }, { status: 400 });
    }

    if (isNaN(current) || current < 0) {
      return NextResponse.json({ message: "Current amount cannot be negative" }, { status: 400 });
    }

    const goal = await prisma.savingGoal.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!goal) {
      return NextResponse.json({ message: "Saving goal not found" }, { status: 404 });
    }

    const updated = await prisma.savingGoal.update({
      where: { id },
      data: {
        name,
        targetAmount: target,
        currentAmount: current,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const deleted = await prisma.savingGoal.deleteMany({
      where: { id, userId: session.user.id }
    });

    if (deleted.count > 0) {
      return NextResponse.json({ message: "Saving goal deleted successfully" });
    }

    return NextResponse.json({ message: "Saving goal not found" }, { status: 404 });
  } catch (error) {
    console.error("Delete goal error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
