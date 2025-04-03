'use client'

import { Sidebar } from '@/components/Sidebar'

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[240px] flex-1">{children}</main>
    </div>
  )
}
