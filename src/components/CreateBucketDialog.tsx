'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import EmojiPicker from 'emoji-picker-react'
import { Theme } from 'emoji-picker-react'

interface CreateBucketDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateBucket: (name: string, emoji: string) => void
}

export function CreateBucketDialog({
  isOpen,
  onClose,
  onCreateBucket,
}: CreateBucketDialogProps) {
  const [bucketName, setBucketName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('📁')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleCreate = () => {
    if (bucketName.trim()) {
      onCreateBucket(bucketName.trim(), selectedEmoji)
      setBucketName('')
      setSelectedEmoji('📁')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Bucket</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-10 w-10 items-center justify-center rounded-md border text-xl hover:bg-zinc-100"
            >
              {selectedEmoji}
            </button>
            <Input
              placeholder="Bucket name"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              className="flex-1"
              autoFocus
            />
          </div>
          {showEmojiPicker && (
            <div className="relative">
              <div className="absolute z-50">
                <EmojiPicker
                  onEmojiClick={(emoji) => {
                    setSelectedEmoji(emoji.emoji)
                    setShowEmojiPicker(false)
                  }}
                  theme={Theme.AUTO}
                  width={350}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!bucketName.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
