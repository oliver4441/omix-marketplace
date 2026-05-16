'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

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
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-200 font-medium animate-pulse">Loading CCHS Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-mesh text-slate-200">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <nav className="glass sticky top-0 z-50 px-6 py-4 border-b border-white/5 shadow-2xl backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="lg:hidden flex items-center gap-4 group">
              <div className="p-2 bg-white/10 rounded-xl">
                <Image src="/logo.svg" alt="CCHS Logo" width={30} height={30} />
              </div>
              <h1 className="text-lg font-black text-white">CCHS</h1>
            </div>
            
            <div className="hidden lg:block">
               <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest">Portal Overview</h2>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-white font-bold text-sm">{user?.name}</span>
                <span className="text-[10px] text-blue-400 font-bold uppercase">{user?.userType || 'Administrator'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="glass-btn-outline !px-5 !py-2 text-xs uppercase tracking-widest !rounded-full"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight">System Overview</h2>
              <p className="text-blue-400 font-medium mt-1">Welcome back, {user?.name.split(' ')[0]}! Here's what's happening today.</p>
            </div>
            <div className="flex gap-3">
              <button className="glass-btn !py-2.5 !px-5 text-sm shadow-xl shadow-blue-500/20">Add Student</button>
              <button className="glass-btn-outline !py-2.5 !px-5 text-sm">Generate Report</button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {[
              { label: 'Students', value: stats?.students, icon: 'students', color: 'from-blue-500/20 to-indigo-500/10' },
              { label: 'Staff Members', value: stats?.staff, icon: 'staff', color: 'from-emerald-500/20 to-teal-500/10' },
              { label: 'Classes', value: stats?.classes, icon: 'classes', color: 'from-amber-500/20 to-orange-500/10' },
              { label: 'Subjects', value: stats?.subjects, icon: 'subjects', color: 'from-purple-500/20 to-pink-500/10' },
              { label: 'Revenue', value: stats?.totalPayments ? `$${stats.totalPayments.toLocaleString()}` : '$0', icon: 'payments', color: 'from-rose-500/20 to-red-500/10' },
            ].map((item, i) => (
              <div key={i} className={`glass-card bg-gradient-to-br ${item.color} group`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Image src={`/icons/${item.icon}.svg`} alt="" width={24} height={24} className="opacity-90" />
                  </div>
                  <h3 className="text-blue-200 text-xs font-black uppercase tracking-widest">{item.label}</h3>
                </div>
                <p className="text-4xl font-black text-white tabular-nums tracking-tight">
                  {item.value ?? 0}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Students Table */}
            <div className="lg:col-span-2 glass-card">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Recent Enrollments</h3>
                <Link href="/students" className="text-blue-400 text-xs font-bold hover:text-blue-300 transition-colors uppercase tracking-widest">View All</Link>
              </div>
              
              {recentStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-blue-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                        <th className="pb-4 px-2">Student</th>
                        <th className="pb-4 px-2">ID Number</th>
                        <th className="pb-4 px-2">Email</th>
                        <th className="pb-4 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentStudents.map((student) => (
                        <tr key={student.id} className="group hover:bg-white/5 transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-500/20">
                                {student.user.name.charAt(0)}
                              </div>
                              <span className="text-white font-bold text-sm">{student.user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-blue-200 text-sm font-medium">{student.admissionNo}</td>
                          <td className="py-4 px-2 text-slate-400 text-xs">{student.user.email}</td>
                          <td className="py-4 px-2 text-right">
                            <button className="p-2 bg-white/5 rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-300">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-slate-500 text-sm font-medium">No recent student activity found.</p>
                </div>
              )}
            </div>

            {/* Recent Payments Feed */}
            <div className="glass-card">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Finances</h3>
                <Link href="/payments" className="text-blue-400 text-xs font-bold hover:text-blue-300 transition-colors uppercase tracking-widest">Records</Link>
              </div>
              
              {recentPayments.length > 0 ? (
                <div className="space-y-6">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{payment.title}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {new Date(payment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-white font-black text-sm tabular-nums">
                        ${payment.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <div className="p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Total Period Balance</p>
                      <p className="text-2xl font-black text-white">${stats?.totalPayments?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-slate-500 text-sm font-medium">No recent transactions.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
