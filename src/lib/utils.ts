import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateNoteTitle(content: string): string {
  // Extract sentences and clean them
  const sentences = content.split(/[.!?]+/).map(s => s.trim())
    .filter(s => s.length >= 10 && s.length <= 100) // Filter out very short or long sentences
  
  if (sentences.length === 0) {
    // If no good sentences, use the first 50 characters of content
    return content.slice(0, 50).trim() || 'Untitled Note'
  }
  
  // Find the most representative sentence
  const sentenceScores = sentences.map(sentence => {
    // Split into words
    const words = sentence.toLowerCase().split(/\s+/)
    
    // Common words to filter out
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'should', 'could', 'this', 'that', 'these', 'those', 'it', 'its',
      'there', 'their', 'they', 'we', 'our', 'you', 'your', 'my', 'mine', 'his', 'her', 'hers'
    ])
    
    // Calculate weights for different factors
    const meaningfulWords = words.filter(word => !commonWords.has(word) && word.length > 2)
    const meaningfulWordsScore = meaningfulWords.length / words.length
    const lengthScore = 1 - Math.abs(40 - sentence.length) / 40 // Prefer sentences around 40 characters
    const startScore = sentence === sentences[0] ? 0.3 : 0 // Bonus for first sentence
    
    // Calculate final score with weights
    const score = (meaningfulWordsScore * 0.5) + (lengthScore * 0.3) + startScore
    
    return { sentence, score }
  })
  
  // Get the highest scoring sentence
  const bestSentence = sentenceScores
    .sort((a, b) => b.score - a.score)[0]?.sentence || ''
  
  // Clean and format the title
  const words = bestSentence.split(/\s+/)
  const title = words
    .slice(0, 8) // Take first 8 words max
    .join(' ')
    .replace(/^[a-z]/, c => c.toUpperCase()) // Capitalize first letter
  
  // If title is too long, try to find a good breakpoint
  if (title.length > 60) {
    const truncated = title.slice(0, 60).split(' ').slice(0, -1).join(' ')
    return truncated + '...'
  }
  
  return title || 'Untitled Note'
} 