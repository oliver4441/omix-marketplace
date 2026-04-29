'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 px-4">
      <div className="glass max-w-md w-full p-8 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Image
              src="/logo.svg"
              alt="CCHS Logo"
              width={120}
              height={120}
              className="mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-white text-center">CCHS Portal</h1>
          <p className="text-blue-200 text-sm mt-2">Chepseon Complex High School</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/20 text-red-200 p-3 rounded-lg text-sm text-center">{error}</div>
          )}

          <div>
            <label className="block text-sm text-blue-200 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/90 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-blue-200 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/90 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-blue-900 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}