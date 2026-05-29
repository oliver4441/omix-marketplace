"use server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const condition = formData.get("condition") as string;
  const location = formData.get("location") as string;
  const categoryId = parseInt(formData.get("category_id") as string);

  await prisma.product.create({
    data: {
      title,
      description,
      price,
      condition: condition as any,
      location,
      categoryId: isNaN(categoryId) ? null : categoryId,
      status: "pending",
      images: [],
      sellerId: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteProduct(productId: string) {
  const session = await auth();
  if (!session?.user) return;
  await prisma.product.deleteMany({
    where: { id: productId, sellerId: session.user.id },
  });
  revalidatePath("/dashboard");
}

export async function markAsSold(productId: string) {
  const session = await auth();
  if (!session?.user) return;
  await prisma.product.updateMany({
    where: { id: productId, sellerId: session.user.id },
    data: { status: "sold" },
  });
  revalidatePath("/dashboard");
}
