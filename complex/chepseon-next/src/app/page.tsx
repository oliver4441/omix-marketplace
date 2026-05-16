import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-hero relative flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-slate-900/90 to-blue-950/80 z-0"></div>
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] z-0"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] z-0"></div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="mb-12 animate-fade-in-up">
          <div className="inline-block p-4 glass rounded-3xl mb-6 shadow-2xl shadow-blue-500/10">
            <Image
              src="/logo.svg"
              alt="CCHS Logo"
              width={100}
              height={100}
              className="drop-shadow-2xl"
            />
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">
              CCHS
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-blue-200/90 font-medium mb-4">
            Chepseon Complex High School
          </p>
          <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full mb-8"></div>
        </div>
        
        <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto text-blue-100/80 leading-relaxed font-light">
          Empowering the next generation through excellence in education. 
          Access your personalized dashboard to manage academic records, 
          payments, and school activities in one modern platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/login" className="glass-btn w-full sm:w-auto shadow-xl">
            Student & Staff Portal
          </Link>
          <Link href="/results" className="glass-btn-outline w-full sm:w-auto">
            View Academic Results
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto border-t border-white/10 pt-10">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">1.2k+</p>
            <p className="text-sm text-blue-300">Students</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">85+</p>
            <p className="text-sm text-blue-300">Teachers</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">100%</p>
            <p className="text-sm text-blue-300">Digital</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">A+</p>
            <p className="text-sm text-blue-300">Excellence</p>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-8 w-full text-center text-sm text-blue-400/60 font-medium tracking-widest uppercase">
        <p>&copy; {new Date().getFullYear()} Chepseon Complex High School</p>
      </footer>

      <style jsx>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
