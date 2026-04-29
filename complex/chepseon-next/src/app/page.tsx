import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2">CCHS</h1>
          <p className="text-xl text-blue-200">Chepseon Complex High School</p>
        </div>
        
        <p className="text-lg mb-8 max-w-md mx-auto text-blue-100">
          Welcome to the CCHS School Management System - a modern platform for managing students, grades, and school operations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="glass-btn">
            Login to Portal
          </Link>
          <Link href="/api/results" className="glass-btn-outline">
            Check Results
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-4 text-center text-sm text-blue-300">
        <p>&copy; {new Date().getFullYear()} Chepseon Complex High School</p>
      </footer>
    </div>
  )
}