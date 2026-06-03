export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  async function handleRegister(formData: FormData) {
    "use server";
    const { signUp } = await import("@/lib/actions/auth");
    return signUp(formData);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#222222]">Create Account</h1>
          <p className="text-[#6a6a6a] mt-2">Join Omix Marketplace today</p>
        </div>

        {params.error && (
          <div className="bg-[rgba(255,56,92,0.06)] border border-[rgba(255,56,92,0.15)] p-3 mb-4 text-sm text-[#ff385c] rounded-xl">
            {params.error}
          </div>
        )}

        <div className="bg-white border border-[#ebebeb] rounded-[14px] p-6">
          <form action={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1.5">Full Name</label>
              <input name="full_name" type="text" required className="airbnb-input" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1.5">Email</label>
              <input name="email" type="email" required className="airbnb-input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1.5">Phone (optional)</label>
              <input name="phone" type="tel" className="airbnb-input" placeholder="07XXXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1.5">Password</label>
              <input name="password" type="password" required minLength={6} className="airbnb-input" placeholder="At least 6 characters" />
            </div>
            <button type="submit" className="btn-primary w-full">Create Account</button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6a6a6a] mt-6">
          Already have an account?{" "}
          <a href="/auth/login" className="text-[#ff385c] hover:text-[#e00b41] font-medium transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  );
}
