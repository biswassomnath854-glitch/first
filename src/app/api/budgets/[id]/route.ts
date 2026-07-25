import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const deleted = await prisma.budget.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (deleted.count > 0) {
      return NextResponse.json({ message: "Budget deleted successfully" });
    }

    return NextResponse.json({ message: "Budget not found" }, { status: 404 });
  } catch (error) {
    console.error("Delete budget error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
