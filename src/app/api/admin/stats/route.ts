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

    const totalUsers = await prisma.user.count();
    const totalIncomes = await prisma.income.count();
    const totalExpenses = await prisma.expense.count();
    
    const allIncomesSum = await prisma.income.aggregate({
      _sum: { amount: true }
    });

    const allExpensesSum = await prisma.expense.aggregate({
      _sum: { amount: true }
    });

    const totalIncomeVolume = allIncomesSum._sum.amount || 0;
    const totalExpenseVolume = allExpensesSum._sum.amount || 0;

    // Fetch user growth metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalIncomes,
        totalExpenses,
        totalTransactions: totalIncomes + totalExpenses,
        totalIncomeVolume,
        totalExpenseVolume,
        recentUsersGrowth: recentUsers
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
