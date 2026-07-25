import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month"); // e.g. "2026-07-01" or "2026-07"

    let queryDate = new Date();
    if (monthParam) {
      queryDate = new Date(monthParam);
    }
    
    // Set query date to 1st of that month
    const startOfMonth = new Date(queryDate.getFullYear(), queryDate.getMonth(), 1);
    const endOfMonth = new Date(queryDate.getFullYear(), queryDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch user budgets for this month
    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id,
        month: startOfMonth,
      },
      include: {
        category: true,
      },
    });

    // For each budget, calculate the total expenses spent in that category for this month
    const budgetsWithSpend = await Promise.all(
      budgets.map(async (budget) => {
        const expenseSum = await prisma.expense.aggregate({
          where: {
            userId: session.user.id,
            categoryId: budget.categoryId,
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        return {
          ...budget,
          currentSpend: expenseSum._sum.amount || 0,
        };
      })
    );

    return NextResponse.json(budgetsWithSpend);
  } catch (error) {
    console.error("Fetch budgets error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { categoryId, limit, month } = await req.json();

    if (!categoryId || limit === undefined || !month) {
      return NextResponse.json({ message: "categoryId, limit, and month are required" }, { status: 400 });
    }

    const budgetLimit = parseFloat(limit);
    if (isNaN(budgetLimit) || budgetLimit < 0) {
      return NextResponse.json({ message: "Limit must be a non-negative number" }, { status: 400 });
    }

    const inputDate = new Date(month);
    const startOfMonth = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);

    // Upsert budget (update if exists, create if not)
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId: session.user.id,
          categoryId,
          month: startOfMonth,
        },
      },
      update: {
        limit: budgetLimit,
      },
      create: {
        userId: session.user.id,
        categoryId,
        limit: budgetLimit,
        month: startOfMonth,
      },
      include: {
        category: true,
      },
    });

    // Calculate current spend for the return payload
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    const expenseSum = await prisma.expense.aggregate({
      where: {
        userId: session.user.id,
        categoryId: budget.categoryId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      ...budget,
      currentSpend: expenseSum._sum.amount || 0,
    });
  } catch (error) {
    console.error("Upsert budget error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
