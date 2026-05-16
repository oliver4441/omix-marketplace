'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'Students', path: '/students', icon: 'students' },
  { name: 'Classes', path: '/classes', icon: 'classes' },
  { name: 'Subjects', path: '/subjects', icon: 'subjects' },
  { name: 'Exams', path: '/exams', icon: 'exams' },
  { name: 'Payments', path: '/payments', icon: 'payments' },
  { name: 'Library', path: '/library', icon: 'library' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen glass sticky top-0 hidden lg:flex flex-col border-r border-white/5">
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Logo" width={40} height={40} />
          <span className="text-white font-black text-xl tracking-tight">CCHS</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold' 
                : 'text-blue-200/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Image 
                src={isActive ? `/icons/${item.icon}.svg` : `/icons/${item.icon}.svg`} 
                alt="" 
                width={20} 
                height={20} 
                className={isActive ? 'brightness-200' : 'opacity-50'}
              />
              <span className="text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-6">
        <div className="glass-dark rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2">School Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-white font-medium">Term 2 - Live</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
