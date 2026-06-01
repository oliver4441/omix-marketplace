import { signIn, signUp } from "@/lib/actions/auth";

export async function handleLogin(formData: FormData) {
  return signIn(formData);
}

export async function handleRegister(formData: FormData) {
  return signUp(formData);
}
