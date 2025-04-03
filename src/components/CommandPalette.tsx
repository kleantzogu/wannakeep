'use client'

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Combobox, Transition } from '@headlessui/react'
import { useSearch } from '@/providers/SearchProvider'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useNotes } from '@/providers/NotesProvider'
import { Note } from '@/types'
import { cn } from '@/lib/utils'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const { query, setQuery } = useSearch()
  const router = useRouter()
  const { notes } = useNotes()
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!query) {
      setFilteredNotes([])
      return
    }

    const searchQuery = query.toLowerCase()
    const results = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery) ||
        note.content.toLowerCase().includes(searchQuery),
    )
    setFilteredNotes(results)
  }, [query, notes])

  const onSelect = (note: Note) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/notes/${note.id}`)
  }

  if (!mounted) return null

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/75" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 pt-[25vh]">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative mx-auto max-w-xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
              <Combobox onChange={onSelect}>
                <div className="flex items-center border-b border-gray-200 px-4 dark:border-gray-800">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
                  <Combobox.Input
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-12 w-full border-0 bg-transparent pl-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-0 dark:text-gray-200"
                    placeholder="Search notes..."
                  />
                </div>

                {filteredNotes.length > 0 && (
                  <Combobox.Options
                    static
                    className="max-h-96 overflow-y-auto py-4 text-sm"
                  >
                    {filteredNotes.map((note) => (
                      <Combobox.Option key={note.id} value={note}>
                        {({ active }) => (
                          <div
                            className={cn(
                              'cursor-pointer px-4 py-2',
                              active && 'bg-gray-100 dark:bg-gray-800',
                            )}
                          >
                            <div className="font-medium text-gray-900 dark:text-gray-200">
                              {note.title}
                            </div>
                            <div className="line-clamp-1 text-gray-500 dark:text-gray-400">
                              {note.content}
                            </div>
                          </div>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}

                {query && filteredNotes.length === 0 && (
                  <div className="px-6 py-14 text-center sm:px-14">
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      No notes found for &quot;{query}&quot;
                    </p>
                  </div>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
