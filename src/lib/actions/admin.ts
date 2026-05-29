"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { user: null, error: "Not authenticated" as const };
  if ((session.user as any).role !== "admin")
    return { user: null, error: "Not authorized" as const };
  return { user: session.user, error: null };
}

export async function approveListing(productId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await prisma.product.update({
    where: { id: productId },
    data: { status: "active" },
  });
  revalidatePath("/admin/listings");
}

export async function rejectListing(productId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await prisma.product.update({
    where: { id: productId },
    data: { status: "rejected" },
  });
  revalidatePath("/admin/listings");
}

export async function confirmPayment(orderId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "paid" },
  });
  revalidatePath("/admin/orders");
}

export async function updateOrderStatus(orderId: string, status: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as any },
  });
  revalidatePath("/admin/orders");
}

export async function verifySeller(userId: string) {
  const ctx = await requireAdmin();
  if (!ctx.user) return;
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true },
  });
  revalidatePath("/admin/users");
}
