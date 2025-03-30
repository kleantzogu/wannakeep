import { Sidebar } from '@/components/Sidebar'

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px]">
        {children}
      </main>
    </div>
  )
} 