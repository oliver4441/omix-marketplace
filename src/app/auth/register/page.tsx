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
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">Join Omix Marketplace today</p>
        </div>

        {params.error && (
          <div className="glass-card p-3 mb-4 text-sm text-red-400 border-red-500/20" style={{ background: "rgba(239,68,68,0.08)" }}>
            {params.error}
          </div>
        )}

        <div className="glass-card p-6">
          <form action={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input name="full_name" type="text" required className="glass-input" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input name="email" type="email" required className="glass-input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone (optional)</label>
              <input name="phone" type="tel" className="glass-input" placeholder="07XXXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input name="password" type="password" required minLength={6} className="glass-input" placeholder="At least 6 characters" />
            </div>
            <button type="submit" className="glass-btn w-full">Create Account</button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <a href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
