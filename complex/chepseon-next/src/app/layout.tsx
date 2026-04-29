import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Chepseon SMS',
    template: '%s | CCHS',
  },
  description: 'Chepseon Complex High School - School Management System',
  metadataBase: new URL('https://chepseon-next-84z16acol-oliver4441s-projects.vercel.app'),
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}