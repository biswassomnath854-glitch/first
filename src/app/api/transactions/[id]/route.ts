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

    const { amount, type, categoryId, date, description, receiptImage } = await req.json();

    if (!amount || !type || !categoryId || !date) {
      return NextResponse.json({ message: "Required fields are missing" }, { status: 400 });
    }

    const transAmount = parseFloat(amount);
    if (isNaN(transAmount) || transAmount <= 0) {
      return NextResponse.json({ message: "Amount must be a positive number" }, { status: 400 });
    }

    // 1. Identify which table the transaction belongs to
    const existingIncome = await prisma.income.findFirst({
      where: { id, userId: session.user.id }
    });

    const existingExpense = await prisma.expense.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!existingIncome && !existingExpense) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
    }

    const currentType = existingIncome ? "INCOME" : "EXPENSE";

    // 2. Verify selected category exists
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

    let updatedTransaction;

    // 3. Handle Type Change or Standard Update
    if (currentType === type) {
      // Type is unchanged, update in place
      if (type === "INCOME") {
        updatedTransaction = await prisma.income.update({
          where: { id },
          data: {
            amount: transAmount,
            categoryId,
            date: new Date(date),
            description: description || null,
          },
          include: { category: true }
        });
      } else {
        updatedTransaction = await prisma.expense.update({
          where: { id },
          data: {
            amount: transAmount,
            categoryId,
            date: new Date(date),
            description: description || null,
            receiptImage: receiptImage !== undefined ? receiptImage : existingExpense!.receiptImage,
          },
          include: { category: true }
        });
      }
    } else {
      // Type is changed! Delete from old table and create in new table
      if (currentType === "INCOME") {
        // Delete from Income
        await prisma.income.delete({ where: { id } });
        // Create in Expense
        updatedTransaction = await prisma.expense.create({
          data: {
            id, // Keep the same ID for simplicity on frontend
            amount: transAmount,
            categoryId,
            date: new Date(date),
            description: description || null,
            receiptImage: receiptImage || null,
            userId: session.user.id,
          },
          include: { category: true }
        });
      } else {
        // Delete from Expense
        await prisma.expense.delete({ where: { id } });
        // Create in Income
        updatedTransaction = await prisma.income.create({
          data: {
            id, // Keep the same ID
            amount: transAmount,
            categoryId,
            date: new Date(date),
            description: description || null,
            userId: session.user.id,
          },
          include: { category: true }
        });
      }
    }

    return NextResponse.json({
      ...updatedTransaction,
      type
    });
  } catch (error) {
    console.error("Update transaction error:", error);
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

    // Attempt delete in Income
    const incomeDelete = await prisma.income.deleteMany({
      where: { id, userId: session.user.id }
    });

    if (incomeDelete.count > 0) {
      return NextResponse.json({ message: "Transaction deleted successfully" });
    }

    // Attempt delete in Expense
    const expenseDelete = await prisma.expense.deleteMany({
      where: { id, userId: session.user.id }
    });

    if (expenseDelete.count > 0) {
      return NextResponse.json({ message: "Transaction deleted successfully" });
    }

    return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
