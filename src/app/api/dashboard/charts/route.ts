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

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Calculate past 6 months income & expense trends
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      if (targetMonth < 0) {
        targetMonth = 12 + targetMonth;
        targetYear = targetYear - 1;
      }

      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const monthLabel = startOfMonth.toLocaleString("default", { month: "short", year: "2-digit" });

      const incomeSum = await prisma.income.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      });

      const expenseSum = await prisma.expense.aggregate({
        where: {
          userId: session.user.id,
          date: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { amount: true }
      });

      trends.push({
        month: monthLabel,
        income: incomeSum._sum.amount || 0,
        expense: expenseSum._sum.amount || 0,
      });
    }

    // 2. Calculate category breakdown for expenses in the current month
    const startOfCurMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const categoriesBreakdown = await prisma.category.findMany({
      where: {
        type: "EXPENSE",
        OR: [
          { userId: null },
          { userId: session.user.id }
        ]
      },
      include: {
        expenses: {
          where: {
            userId: session.user.id,
            date: { gte: startOfCurMonth, lte: endOfCurMonth }
          }
        }
      }
    });

    const categoryData = categoriesBreakdown
      .map(cat => {
        const total = cat.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        return {
          categoryName: cat.name,
          color: cat.color || "#6b7280",
          icon: cat.icon || "Tag",
          amount: total
        };
      })
      .filter(item => item.amount > 0) // Only include categories with expenditures
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      trends,
      categoryDistribution: categoryData
    });
  } catch (error) {
    console.error("Dashboard charts error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
