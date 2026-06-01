export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string; created?: string }>;
}) {
  const params = await searchParams;

  async function handleLogin(formData: FormData) {
    "use server";
    const { signIn } = await import("@/lib/actions/auth");
    return signIn(formData);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2">Sign in to your Omix account</p>
        </div>

        {params.error && (
          <div className="glass-card p-3 mb-4 text-sm text-red-400 border-red-500/20" style={{ background: "rgba(239,68,68,0.08)" }}>
            {params.error}
          </div>
        )}
        {params.created && (
          <div className="glass-card p-3 mb-4 text-sm text-emerald-400 border-emerald-500/20" style={{ background: "rgba(16,185,129,0.08)" }}>
            Account created successfully. Sign in below.
          </div>
        )}

        <div className="glass-card p-6">
          <form action={handleLogin} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={params.callbackUrl || "/"} />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input name="email" type="email" required className="glass-input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input name="password" type="password" required className="glass-input" placeholder="Your password" />
            </div>
            <button type="submit" className="glass-btn w-full">Sign In</button>
          </form>

          <div className="mt-4 text-center">
            <a href="/auth/forgot-password" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          New to Omix?{" "}
          <a href="/auth/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
