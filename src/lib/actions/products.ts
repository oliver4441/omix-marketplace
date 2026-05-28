"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const condition = formData.get("condition") as string;
  const location = formData.get("location") as string;
  const categoryId = parseInt(formData.get("category_id") as string);

  const images: string[] = [];
  const files = formData.getAll("images") as File[];
  for (const file of files) {
    if (file.size === 0) continue;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, file);
    if (!error) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(path);
      images.push(publicUrl);
    }
  }

  const { error } = await supabase.from("products").insert({
    seller_id: user.id,
    category_id: categoryId,
    title,
    description,
    price,
    condition,
    location,
    images,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("seller_id", user.id);
  revalidatePath("/dashboard");
}

export async function markAsSold(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("products")
    .update({ status: "sold" })
    .eq("id", productId)
    .eq("seller_id", user.id);
  revalidatePath("/dashboard");
}
