export interface Note {
  id: string
  title: string
  content: string
  sentiment: string
  tags: string[]
  projectId: string
  bucketId?: string
  isBookmarked: boolean
  createdAt: string
  updatedAt: string
  textPosition?: {
    start: number
    end: number
  }
  exactText?: string
}

export interface Project {
  id: string
  title: string
  sourceText: string
  createdAt: string
  notes?: Note[]
  displayTitle?: string
}
