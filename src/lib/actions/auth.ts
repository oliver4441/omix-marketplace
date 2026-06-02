"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileUpdateData {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  location_city?: string;
  location_region?: string;
  seller_bio?: string;
  store_slug?: string;
  store_name?: string;
  store_description?: string;
}

export interface CurrentUserResult {
  user: {
    id: string;
    email?: string;
    user_metadata: Record<string, unknown>;
  };
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    location_city: string | null;
    seller_bio: string | null;
    rating_avg: number | null;
    rating_count: number | null;
    verified_badge: boolean | null;
    phone_verified: boolean | null;
    id_verified: boolean | null;
    store_slug: string | null;
    store_name: string | null;
    store_description: string | null;
    is_admin: boolean | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Auth actions
// ---------------------------------------------------------------------------

export async function signUp(formData: FormData) {
  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const phone = (formData.get("phone") as string) || null;

  if (!email || !password || !fullName) {
    redirect("/auth/register?error=Name%2C+email%2C+and+password+are+required");
  }
  if (password.length < 6) {
    redirect("/auth/register?error=Password+must+be+at+least+6+characters");
  }

  const supabase = await createClient();

  // Sign up via Supabase Auth with full_name in metadata
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: undefined, // Let Supabase handle email confirmation
    },
  });

  if (signUpError) {
    // Handle specific known errors
    const msg = signUpError.message || "Failed to create account";
    if (msg.toLowerCase().includes("already registered")) {
      redirect("/auth/login?error=An+account+with+this+email+already+exists");
    }
    redirect(`/auth/register?error=${encodeURIComponent(msg)}`);
  }

  // signUpData.user is null when email confirmation is enabled
  // In that case, we can't auto-sign-in — user must confirm email first
  if (!signUpData.user) {
    // Email confirmation required — redirect to a "check your email" page
    redirect("/auth/login?created=true");
  }

  const userId = signUpData.user.id;

  // Update the profiles row (trigger already created a stub)
  // Store full_name properly and phone if provided
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: fullName,
        phone: phone && phone.length > 0 ? phone : null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    );

  if (profileError) {
    console.error("Failed to create profile on signup:", profileError);
  }

  // Auto sign-in after registration
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirect("/auth/login?created=true");
  }

  redirect("/");
}

/** @deprecated Use signUp instead */
export async function register(formData: FormData) {
  return signUp(formData);
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  // Validate callbackUrl — only allow local paths, not external URLs
  const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/auth/login?error=Invalid+email+or+password");
  }

  // Update last_seen_at on every sign-in
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  redirect(safeCallback);
}

/** @deprecated Use signIn instead */
export async function login(formData: FormData) {
  return signIn(formData);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** @deprecated Use signOut instead */
export async function logout() {
  return signOut();
}

// ---------------------------------------------------------------------------
// Current user helper
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<CurrentUserResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, phone, location_city, seller_bio, rating_avg, rating_count, verified_badge, phone_verified, id_verified, store_slug, store_name, store_description, is_admin"
    )
    .eq("id", user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    },
    profile,
  };
}

// ---------------------------------------------------------------------------
// Auth guards
// ---------------------------------------------------------------------------

export async function requireAuth() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/auth/login");
  }
  return currentUser;
}

export async function requireAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.profile?.is_admin) {
    redirect("/");
  }
  return currentUser;
}

// ---------------------------------------------------------------------------
// Profile management
// ---------------------------------------------------------------------------

export async function updateProfile(userId: string, data: ProfileUpdateData) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized: can only update your own profile");
  }

  // Build the update payload with only provided fields
  const updatePayload: Record<string, unknown> = {};

  if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
  if (data.avatar_url !== undefined) updatePayload.avatar_url = data.avatar_url;
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.location_city !== undefined) updatePayload.location_city = data.location_city;
  if (data.location_region !== undefined) updatePayload.location_region = data.location_region;
  if (data.seller_bio !== undefined) updatePayload.seller_bio = data.seller_bio;
  if (data.store_slug !== undefined) updatePayload.store_slug = data.store_slug;
  if (data.store_name !== undefined) updatePayload.store_name = data.store_name;
  if (data.store_description !== undefined) updatePayload.store_description = data.store_description;

  // If store_slug is being changed, check uniqueness
  if (data.store_slug !== undefined) {
    const slug = data.store_slug.trim().toLowerCase();
    if (slug.length > 0) {
      const { data: existing, error: slugCheckErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("store_slug", slug)
        .neq("id", userId)
        .maybeSingle();

      if (slugCheckErr) {
        throw new Error(`Store slug check failed: ${slugCheckErr.message}`);
      }
      if (existing) {
        throw new Error("Store slug already taken");
      }
    }
    updatePayload.store_slug = slug;
  }

  updatePayload.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Trust & verification
// ---------------------------------------------------------------------------

/**
 * Mark a user's phone as verified.  Caller should have already confirmed the
 * OTP / SMS flow — this function updates profiles.phone_verified and records
 * the verification in the trust_verification audit table.
 */
export async function verifyPhone(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ phone_verified: true })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to verify phone: ${error.message}`);
  }

  // Also record in trust_verification table for audit trail
  const { error: trustErr } = await supabase
    .from("trust_verification")
    .insert({
      user_id: userId,
      verification_type: "phone",
      status: "verified",
      verified_at: new Date().toISOString(),
    });

  if (trustErr) {
    console.error("Failed to insert phone trust_verification record:", trustErr);
  }

  return { success: true };
}

/**
 * Submit an ID / document verification request.  The document image should
 * already be uploaded (e.g. to Supabase Storage); pass the resulting URL.
 * Inserts a pending record into trust_verification.
 */
export async function submitIdVerification(
  userId: string,
  documentUrl: string,
  documentType: string
) {
  const supabase = await createClient();

  if (!documentUrl || !documentType) {
    throw new Error("documentUrl and documentType are required");
  }

  const { error } = await supabase
    .from("trust_verification")
    .insert({
      user_id: userId,
      verification_type: "id",
      document_type: documentType,
      document_url: documentUrl,
      status: "pending",
    });

  if (error) {
    throw new Error(`Failed to submit ID verification: ${error.message}`);
  }

  // Set id_verified to false until admin reviews
  await supabase
    .from("profiles")
    .update({ id_verified: false })
    .eq("id", userId);

  return { success: true };
}

/** @deprecated Use submitIdVerification instead */
export async function verifyId(
  userId: string,
  documentUrl: string,
  documentType: string
) {
  return submitIdVerification(userId, documentUrl, documentType);
}
