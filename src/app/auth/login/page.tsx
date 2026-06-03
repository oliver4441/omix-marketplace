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
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Welcome back</h1>
          <p className="text-[var(--text-secondary)] mt-2">Sign in to your Omix account</p>
        </div>

        {params.error && (
          <div className="bg-[rgba(255,56,92,0.06)] border border-[rgba(255,56,92,0.15)] p-3 mb-4 text-sm text-[#ff385c] rounded-xl">
            {params.error}
          </div>
        )}
        {params.created && (
          <div className="bg-[rgba(39,166,68,0.06)] border border-[rgba(39,166,68,0.15)] p-3 mb-4 text-sm text-[#27a644] rounded-xl">
            Account created successfully. Sign in below.
          </div>
        )}

        <div className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[14px] p-6">
          <form action={handleLogin} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={params.callbackUrl || "/"} />
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <input name="email" type="email" required className="airbnb-input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Password</label>
              <input name="password" type="password" required className="airbnb-input" placeholder="Your password" />
            </div>
            <button type="submit" className="btn-primary w-full">Sign In</button>
          </form>
          <div className="mt-4 text-center">
            <a href="/auth/forgot-password" className="text-sm text-[var(--text-secondary)] hover:text-[#ff385c] transition-colors">Forgot password?</a>
          </div>
        </div>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          New to Omix?{" "}
          <a href="/auth/register" className="text-[#ff385c] hover:text-[#e00b41] font-medium transition-colors">Create an account</a>
        </p>
      </div>
    </div>
  );
}
