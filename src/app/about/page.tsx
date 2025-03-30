import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">About Wannakeep</h1>
      
      <div className="prose dark:prose-invert max-w-none mb-12">
        <p className="text-xl leading-relaxed mb-6">
          Wannakeep is a note-keeping and organization app designed to save users countless hours by efficiently capturing, 
          organizing, and managing notes from various sources, including meetings, PDFs, text files, and ebooks.
        </p>
        
        <p className="mb-6">
          Our mission is to help you organize your thoughts, research, and information in a visual and intuitive way.
          Notes are visually represented as color-coded sticky notes, organized by sentiment, tags, and references.
        </p>
      </div>
      
      <h2 className="text-2xl font-bold mb-6">Key Features</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <FeatureCard 
          title="Note Creation" 
          description="Text input manually or automatically generated from recordings. Import from PDFs, text files, ebooks." 
        />
        
        <FeatureCard 
          title="Visual Organization" 
          description="Sticky-note visual format. Color-coded sentiment classification: Green (Positive), Blue (Neutral), Red (Negative)." 
        />
        
        <FeatureCard 
          title="Tagging and Reference" 
          description="Customizable tagging for quick retrieval. Reference source tracking (URL, file name, timestamp)." 
        />
      </div>
      
      <div className="text-center">
        <Link href="/">
          <Button size="lg" className="mx-2">Get Started</Button>
        </Link>
        <Link href="/notes">
          <Button variant="outline" size="lg" className="mx-2">Explore Notes</Button>
        </Link>
      </div>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{description}</p>
      </CardContent>
    </Card>
  )
} 