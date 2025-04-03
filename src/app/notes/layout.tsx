import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Notes - Wannakeep',
  description: 'Manage and organize your notes',
}

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-full flex-1">{children}</div>
}
