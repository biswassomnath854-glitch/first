import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Enforce admin permission
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            incomes: true,
            expenses: true,
          }
        }
      }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
      transactionsCount: user._count.incomes + user._count.expenses
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Admin list users error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
