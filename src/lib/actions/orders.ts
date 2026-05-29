"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COMMISSION_RATE, DELIVERY_ZONES } from "@/lib/constants";

export async function createOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const productId = formData.get("product_id") as string;
  const deliveryZoneId = parseInt(formData.get("delivery_zone_id") as string);
  const deliveryAddress = formData.get("delivery_address") as string;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) return { error: "Product not found" };

  const zone = DELIVERY_ZONES.find((z) => z.id === deliveryZoneId);
  const deliveryFee = zone ? zone.fee * 100 : 0;
  const commission = Math.round(product.price * COMMISSION_RATE);
  const totalAmount = product.price + deliveryFee;

  const order = await prisma.order.create({
    data: {
      productId,
      buyerId: session.user.id,
      sellerId: product.sellerId,
      amount: totalAmount,
      commission,
      deliveryFee,
      deliveryAddress,
      status: "pending_payment",
    },
  });
  return { orderId: order.id, amount: totalAmount };
}

export async function submitReceipt(orderId: string, receipt: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  await prisma.order.updateMany({
    where: { id: orderId, buyerId: session.user.id },
    data: { mpesaReceipt: receipt },
  });
  return { success: true };
}
