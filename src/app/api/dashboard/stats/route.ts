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

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const startOfPrevMonth = new Date(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1, 1);
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 1. Calculate All-Time stats for Total Balance
    const allIncomesSum = await prisma.income.aggregate({
      where: { userId: session.user.id },
      _sum: { amount: true }
    });

    const allExpensesSum = await prisma.expense.aggregate({
      where: { userId: session.user.id },
      _sum: { amount: true }
    });

    const totalIncomeAllTime = allIncomesSum._sum.amount || 0;
    const totalExpenseAllTime = allExpensesSum._sum.amount || 0;
    const totalBalance = totalIncomeAllTime - totalExpenseAllTime;

    // 2. Current Month Income vs Previous Month Income
    const currentMonthIncome = await prisma.income.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }
      },
      _sum: { amount: true }
    });

    const prevMonthIncome = await prisma.income.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: startOfPrevMonth, lte: endOfPrevMonth }
      },
      _sum: { amount: true }
    });

    const curIncVal = currentMonthIncome._sum.amount || 0;
    const prevIncVal = prevMonthIncome._sum.amount || 0;
    let incomeChangePct = 0;
    if (prevIncVal > 0) {
      incomeChangePct = ((curIncVal - prevIncVal) / prevIncVal) * 100;
    } else if (curIncVal > 0) {
      incomeChangePct = 100; // 100% increase if starting from zero
    }

    // 3. Current Month Expense vs Previous Month Expense
    const currentMonthExpense = await prisma.expense.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }
      },
      _sum: { amount: true }
    });

    const prevMonthExpense = await prisma.expense.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: startOfPrevMonth, lte: endOfPrevMonth }
      },
      _sum: { amount: true }
    });

    const curExpVal = currentMonthExpense._sum.amount || 0;
    const prevExpVal = prevMonthExpense._sum.amount || 0;
    let expenseChangePct = 0;
    if (prevExpVal > 0) {
      expenseChangePct = ((curExpVal - prevExpVal) / prevExpVal) * 100;
    } else if (curExpVal > 0) {
      expenseChangePct = 100;
    }

    // 4. Savings (Goal targets vs current savings)
    const goalsAggregate = await prisma.savingGoal.aggregate({
      where: { userId: session.user.id },
      _sum: {
        targetAmount: true,
        currentAmount: true
      }
    });

    const totalGoalTarget = goalsAggregate._sum.targetAmount || 0;
    const totalGoalCurrent = goalsAggregate._sum.currentAmount || 0;

    // 5. Recent transactions (Fetch last 10 incomes and expenses, combine, slice 5)
    const recentIncomes = await prisma.income.findMany({
      where: { userId: session.user.id },
      take: 10,
      orderBy: { date: "desc" },
      include: { category: true }
    });

    const recentExpenses = await prisma.expense.findMany({
      where: { userId: session.user.id },
      take: 10,
      orderBy: { date: "desc" },
      include: { category: true }
    });

    const taggedIncomes = recentIncomes.map(i => ({ ...i, type: "INCOME" }));
    const taggedExpenses = recentExpenses.map(e => ({ ...e, type: "EXPENSE" }));
    const combined = [...taggedIncomes, ...taggedExpenses];
    
    // Sort by date desc
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentTransactions = combined.slice(0, 5);

    return NextResponse.json({
      summary: {
        totalBalance,
        currentMonthIncome: curIncVal,
        incomeChangePct,
        currentMonthExpense: curExpVal,
        expenseChangePct,
        savings: {
          target: totalGoalTarget,
          current: totalGoalCurrent,
          percentage: totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0
        }
      },
      recentTransactions
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
