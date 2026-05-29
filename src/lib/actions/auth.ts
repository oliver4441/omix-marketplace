"use server";

import { signIn as nextSignIn, signOut as nextSignOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await nextSignIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    redirect("/auth/login?error=Invalid+email+or+password");
  }
  redirect("/");
}

export async function register(formData: FormData) {
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "buyer";

  if (!email || !password || !fullName) {
    redirect("/auth/register?error=Name%2C+email%2C+and+password+are+required");
  }
  if (password.length < 6) {
    redirect("/auth/register?error=Password+must+be+at+least+6+characters");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/auth/register?error=Email+already+registered");

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: fullName,
      email,
      hashedPassword,
      phone: phone || null,
      role: role as any,
    },
  });

  try {
    await nextSignIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch {
    redirect("/auth/login?created=true");
  }
  redirect("/");
}

export async function logout() {
  await nextSignOut({ redirect: false });
  redirect("/");
}
