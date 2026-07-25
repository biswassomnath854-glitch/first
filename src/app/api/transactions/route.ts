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
    const type = searchParams.get("type") || "ALL"; // "INCOME", "EXPENSE", or "ALL"
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Build common filter parameters
    const commonFilter: any = {
      userId: session.user.id,
    };

    if (categoryId) {
      commonFilter.categoryId = categoryId;
    }

    if (startDate || endDate) {
      commonFilter.date = {};
      if (startDate) commonFilter.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        commonFilter.date.lte = end;
      }
    }

    if (search) {
      commonFilter.OR = [
        { description: { contains: search } },
        { category: { name: { contains: search } } }
      ];
    }

    let incomes: any[] = [];
    let expenses: any[] = [];

    // Query databases based on the requested transaction type
    if (type === "ALL" || type === "INCOME") {
      incomes = await prisma.income.findMany({
        where: commonFilter,
        include: { category: true },
      });
    }

    if (type === "ALL" || type === "EXPENSE") {
      expenses = await prisma.expense.findMany({
        where: commonFilter,
        include: { category: true },
      });
    }

    // Merge and tag transactions
    const taggedIncomes = incomes.map(i => ({ ...i, type: "INCOME" }));
    const taggedExpenses = expenses.map(e => ({ ...e, type: "EXPENSE" }));
    const allTransactions = [...taggedIncomes, ...taggedExpenses];

    // Sort by date descending, then by createdAt descending
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      
      const createdA = new Date(a.createdAt).getTime();
      const createdB = new Date(b.createdAt).getTime();
      return createdB - createdA;
    });

    const totalCount = allTransactions.length;
    const paginatedTransactions = allTransactions.slice(skip, skip + limit);

    return NextResponse.json({
      transactions: paginatedTransactions,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, type, categoryId, date, description, receiptImage } = await req.json();

    if (!amount || !type || !categoryId || !date) {
      return NextResponse.json({ message: "Required fields are missing" }, { status: 400 });
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ message: "Type must be INCOME or EXPENSE" }, { status: 400 });
    }

    const transAmount = parseFloat(amount);
    if (isNaN(transAmount) || transAmount <= 0) {
      return NextResponse.json({ message: "Amount must be a positive number" }, { status: 400 });
    }

    // Verify category exists
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [
          { userId: null },
          { userId: session.user.id }
        ]
      }
    });

    if (!category) {
      return NextResponse.json({ message: "Invalid category selected" }, { status: 400 });
    }

    let transaction;

    if (type === "INCOME") {
      transaction = await prisma.income.create({
        data: {
          amount: transAmount,
          categoryId,
          date: new Date(date),
          description: description || null,
          userId: session.user.id,
        },
        include: { category: true }
      });
    } else {
      transaction = await prisma.expense.create({
        data: {
          amount: transAmount,
          categoryId,
          date: new Date(date),
          description: description || null,
          receiptImage: receiptImage || null,
          userId: session.user.id,
        },
        include: { category: true }
      });
    }

    return NextResponse.json({
      ...transaction,
      type
    }, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
