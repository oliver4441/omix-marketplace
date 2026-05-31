"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// =============================================
// UPLOAD IMAGES — Server-side upload to Supabase Storage
// =============================================
// Images are stored in the "listing-images" bucket
// Path: {listingId}/{filename}
// =============================================

const BUCKET = "listing-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

export async function uploadImages(
  listingId: string,
  formData: FormData
): Promise<{ success: boolean; images: { id: string; url: string; storage_path: string }[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify listing ownership
  const { data: listing } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.seller_id !== user.id) {
    return { success: false, images: [], error: "Not authorized" };
  }

  // Get files from form
  const files: File[] = [];
  for (let i = 0; i < MAX_IMAGES; i++) {
    const file = formData.get(`photo_${i}`) as File | null;
    if (file && file.size > 0) {
      files.push(file);
    }
  }

  if (files.length === 0) {
    // Try single "photos" field
    const photos = formData.getAll("photos") as File[];
    for (const f of photos) {
      if (f.size > 0) files.push(f);
    }
  }

  // Validate
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, images: [], error: `${file.name} exceeds 5MB limit` };
    }
    if (!file.type.startsWith("image/")) {
      return { success: false, images: [], error: `${file.name} is not an image` };
    }
  }

  const uploadedImages: { id: string; url: string; storage_path: string }[] = [];

  // Upload each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${listingId}/${Date.now()}_${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, file, {
        cacheControl: "3600",
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return { success: false, images: uploadedImages, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    // Insert into listing_images table
    const { data: imgRecord, error: dbError } = await supabase
      .from("listing_images")
      .insert({
        listing_id: listingId,
        image_url: urlData.publicUrl,
        storage_path: filename,
        is_primary: i === 0,
        sort_order: i,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return { success: false, images: uploadedImages, error: dbError.message };
    }

    uploadedImages.push({
      id: imgRecord.id,
      url: urlData.publicUrl,
      storage_path: filename,
    });
  }

  // If no images were uploaded but listing has none, set placeholder handled client-side

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard");

  return { success: true, images: uploadedImages };
}

// =============================================
// DELETE IMAGE — Remove image from storage + DB
// =============================================
export async function deleteImage(imageId: string, listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Verify ownership via listing
  const { data: image } = await supabase
    .from("listing_images")
    .select("storage_path, listing_id")
    .eq("id", imageId)
    .single();

  if (!image) return { error: "Image not found" };

  // Check listing ownership
  const { data: listing } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", image.listing_id)
    .single();

  if (!listing || listing.seller_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Delete from storage
  if (image.storage_path) {
    await supabase.storage.from(BUCKET).remove([image.storage_path]);
  }

  // Delete from DB
  await supabase.from("listing_images").delete().eq("id", imageId);

  revalidatePath(`/listings/${listingId}`);
  return { success: true };
}

// =============================================
// GET LISTING IMAGES — For gallery display
// =============================================
export async function getListingImages(listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listing_images")
    .select("id, image_url, storage_path, is_primary, sort_order")
    .eq("listing_id", listingId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data || [];
}
