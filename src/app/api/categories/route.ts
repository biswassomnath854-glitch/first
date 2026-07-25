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
    const type = searchParams.get("type"); // "INCOME" or "EXPENSE"

    // Fetch categories: system categories (userId = null) + user categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          { userId: session.user.id }
        ],
        ...(type ? { type } : {})
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, type, icon, color } = await req.json();

    if (!name || !type) {
      return NextResponse.json({ message: "Name and type are required" }, { status: 400 });
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ message: "Type must be INCOME or EXPENSE" }, { status: 400 });
    }

    const normalizedName = name.trim();

    // Check if category already exists for this user (or globally)
    const existing = await prisma.category.findFirst({
      where: {
        name: normalizedName,
        type,
        OR: [
          { userId: null },
          { userId: session.user.id }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { message: `Category '${normalizedName}' already exists` },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: normalizedName,
        type,
        icon: icon || "Tag",
        color: color || "#6b7280",
        userId: session.user.id
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
