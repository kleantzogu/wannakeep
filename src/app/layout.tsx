import { Inter } from 'next/font/google'
import RootLayoutClient from '@/components/RootLayoutClient'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Metadata configuration (server-side)
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Wannakeep - Note Organization App',
  description:
    'Capture, organize, and manage notes from various sources with visual sticky notes',
}

// Server-side configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RootLayoutClient fontClassName={inter.className}>
      {children}
    </RootLayoutClient>
  )
}
