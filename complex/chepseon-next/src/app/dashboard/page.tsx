'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface DashboardStats {
  students: number
  staff: number
  classes: number
  subjects: number
  totalPayments: number
}

interface RecentStudent {
  id: number
  admissionNo: string
  user: { name: string; email: string }
}

interface RecentPayment {
  id: number
  title: string
  amount: number
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token) {
      router.push('/login')
      return
    }

    if (userStr) {
      setUser(JSON.parse(userStr))
    }

    fetchData(token)
  }, [])

  const fetchData = async (token: string) => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        fetch('/api/dashboard?type=stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/dashboard?type=recent', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json()
        setRecentStudents(recentData.recentStudents || [])
        setRecentPayments(recentData.recentPayments || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <nav className="glass border-b border-white/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="CCHS Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <h1 className="text-2xl font-bold text-white">CCHS Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && <span className="text-blue-200">{user.name}</span>}
            <button
              onClick={handleLogout}
              className="btn-glass px-6 py-2 rounded-lg text-sm hover:bg-white/20 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-white mb-8">Dashboard</h2>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="glass p-6 rounded-xl hover:bg-white/15 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500/30 p-2 rounded-lg">
                  <Image src="/icons/students.svg" alt="" width={24} height={24} className="text-white" />
                </div>
                <h3 className="text-blue-200 text-sm uppercase">Students</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.students}</p>
            </div>
            <div className="glass p-6 rounded-xl hover:bg-white/15 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500/30 p-2 rounded-lg">
                  <Image src="/icons/staff.svg" alt="" width={24} height={24} className="text-white" />
                </div>
                <h3 className="text-blue-200 text-sm uppercase">Staff</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.staff}</p>
            </div>
            <div className="glass p-6 rounded-xl hover:bg-white/15 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500/30 p-2 rounded-lg">
                  <Image src="/icons/classes.svg" alt="" width={24} height={24} className="text-white" />
                </div>
                <h3 className="text-blue-200 text-sm uppercase">Classes</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.classes}</p>
            </div>
            <div className="glass p-6 rounded-xl hover:bg-white/15 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500/30 p-2 rounded-lg">
                  <Image src="/icons/subjects.svg" alt="" width={24} height={24} className="text-white" />
                </div>
                <h3 className="text-blue-200 text-sm uppercase">Subjects</h3>
              </div>
              <p className="text-3xl font-bold text-white">{stats.subjects}</p>
            </div>
            <div className="glass p-6 rounded-xl hover:bg-white/15 transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500/30 p-2 rounded-lg">
                  <Image src="/icons/payments.svg" alt="" width={24} height={24} className="text-white" />
                </div>
                <h3 className="text-blue-200 text-sm uppercase">Total Payments</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                ${stats.totalPayments.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Students</h3>
            {recentStudents.length > 0 ? (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/30 p-2 rounded-full">
                        <span className="text-white text-sm font-bold">
                          {student.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{student.user.name}</p>
                        <p className="text-blue-200 text-sm">{student.admissionNo}</p>
                      </div>
                    </div>
                    <span className="text-blue-200 text-sm">{student.user.email}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-200">No recent students</p>
            )}
          </div>

          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Payments</h3>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center border-b border-white/10 pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-white font-medium">{payment.title}</p>
                      <p className="text-blue-200 text-sm">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-white font-semibold">
                      ${payment.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-blue-200">No recent payments</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
