"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function sendInquiry(productId: string, message: string) {
  const session = await auth();
  if (!session?.user) return { error: "Please sign in first" };

  await prisma.inquiry.create({
    data: {
      productId,
      buyerId: session.user.id,
      message,
    },
  });
  return { success: true };
}
