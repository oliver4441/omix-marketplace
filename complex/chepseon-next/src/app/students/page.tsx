'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Sidebar from '@/components/Sidebar'

interface Student {
  id: number
  admissionNo: string
  year: number
  user: {
    name: string
    email: string
    gender: string
  }
  myClass: {
    name: string
    classType: { name: string }
  } | null
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchStudents(token)
  }, [])

  const fetchStudents = async (token: string) => {
    try {
      const res = await fetch(`/api/students${search ? `?search=${search}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (token) fetchStudents(token)
  }

  return (
    <div className="flex min-h-screen bg-mesh text-slate-200">
      <Sidebar />

      <main className="flex-1 px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">Student Directory</h2>
            <p className="text-blue-400 font-medium mt-1">Manage and view all enrolled students at CCHS.</p>
          </div>
          <button className="glass-btn shadow-xl shadow-blue-500/20 whitespace-nowrap">
            + Enroll New Student
          </button>
        </div>

        {/* Search and Filters */}
        <div className="glass-card mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or admission number..." 
                className="glass-input !pl-12"
              />
            </div>
            <button type="submit" className="glass-btn-outline !py-3">Search</button>
          </form>
        </div>

        {/* Students Table */}
        <div className="glass-card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-blue-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                  <th className="py-6 px-6">Student Info</th>
                  <th className="py-6 px-6">Admission No</th>
                  <th className="py-6 px-6">Class</th>
                  <th className="py-6 px-6">Year</th>
                  <th className="py-6 px-6">Gender</th>
                  <th className="py-6 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="group hover:bg-white/5 transition-colors">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            {student.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-bold">{student.user.name}</p>
                            <p className="text-slate-500 text-xs">{student.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 font-mono text-sm text-blue-200">{student.admissionNo}</td>
                      <td className="py-5 px-6">
                        {student.myClass ? (
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase border border-blue-500/20">
                            {student.myClass.classType.name} {student.myClass.name}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-slate-300 text-sm font-medium">{student.year}</td>
                      <td className="py-5 px-6">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${student.user.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>
                          {student.user.gender}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button className="p-2 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-500 font-medium">
                      No students found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
