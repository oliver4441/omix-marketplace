import { login } from "@/lib/actions/auth";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your Omix account</p>
        </div>
        {params.error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            {params.error}
          </div>
        )}
        <form
          action={login}
          className="space-y-4 bg-white p-6 rounded-xl shadow-sm border"
        >
          <input type="hidden" name="callbackUrl" value={params.callbackUrl || "/"} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
          >
            Sign In
          </button>
          <p className="text-sm text-center text-gray-500">
            <Link href="/auth/forgot-password" className="text-emerald-600 font-medium">
              Forgot password?
            </Link>
          </p>
          <p className="text-sm text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-emerald-600 font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
