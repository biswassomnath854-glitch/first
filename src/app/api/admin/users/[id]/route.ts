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
    
    // Enforce admin permission
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { role } = await req.json();

    if (!role || (role !== "USER" && role !== "ADMIN")) {
      return NextResponse.json({ message: "Invalid role specified" }, { status: 400 });
    }

    // Prevent demoting the self-admin account currently logged in
    if (id === session.user.id && role !== "ADMIN") {
      return NextResponse.json({ message: "Cannot demote your own admin account" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({
      message: `User role updated to ${role} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error("Admin update user error:", error);
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
    
    // Enforce admin permission
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ message: "Cannot delete your own admin account" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Delete user (Prisma cascade relationships are configured in schema.prisma)
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User account deleted successfully from the platform" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
