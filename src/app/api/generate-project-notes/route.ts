import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID, // Optional: Add if you have an org ID
  dangerouslyAllowBrowser: false,
})

// Function to split text into chunks that fit within token limits
function chunkText(text: string, maxChunkLength = 4000): string[] {
  // If text is short enough, return it as is
  if (text.length <= maxChunkLength) {
    return [text];
  }

  const chunks: string[] = [];
  
  // Find good break points (paragraphs, sentences) to split text
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Determine end index for this chunk (either max length or end of text)
    let endIndex = Math.min(startIndex + maxChunkLength, text.length);
    
    // If we're not at the end of the text, try to find a good break point
    if (endIndex < text.length) {
      // Look for paragraph breaks first
      const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
      if (paragraphBreak > startIndex && paragraphBreak > endIndex - 500) {
        endIndex = paragraphBreak;
      } else {
        // Look for sentence breaks
        const sentenceBreak = text.lastIndexOf('. ', endIndex);
        if (sentenceBreak > startIndex && sentenceBreak > endIndex - 200) {
          endIndex = sentenceBreak + 1; // Include the period
        }
      }
    }
    
    // Add the chunk to our array
    chunks.push(text.substring(startIndex, endIndex).trim());
    
    // Move to the next chunk
    startIndex = endIndex;
  }
  
  return chunks;
}

// Generate notes from content and url
async function generateNotesFromContent(title: string, content: string, url: string, notesCount: number = 5, charLimit: number = 280): Promise<any[]> {
  try {
    console.log(`Generating ${notesCount} notes for URL: ${url}`);
    
    // Validate character limit
    const validatedCharLimit = Math.max(120, Math.min(360, charLimit));
    
    // Split content into manageable chunks
    const contentChunks = chunkText(content);
    console.log(`Content split into ${contentChunks.length} chunks`);
    
    if (contentChunks.length === 0) {
      throw new Error('No content to analyze');
    }
    
    // Process each chunk to extract key points
    let allNotes: any[] = [];
    
    for (let i = 0; i < contentChunks.length; i++) {
      console.log(`Processing chunk ${i+1} of ${contentChunks.length}`);
      const chunk = contentChunks[i];
      
      // Calculate notes per chunk
      const notesPerChunk = Math.max(1, Math.ceil(notesCount / contentChunks.length));
      
      // Generate notes from this chunk
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a note extraction assistant. Extract key information from this web article and organize it into concise, meaningful notes.
            
            IMPORTANT: You must respond ONLY with a JSON object in this exact format, with no additional text or explanation:
            {
              "notes": [
                {
                  "title": "Short note title",
                  "content": "Key point or information (max ${validatedCharLimit} chars)",
                  "sentiment": "positive" | "neutral" | "negative",
                  "tags": ["relevant", "tags", "max 3 per note"],
                  "exactText": "Exact text from the original document that this note is based on",
                  "textPosition": {
                    "start": 0,
                    "end": 0
                  }
                }
              ]
            }

            Rules:
            1. Each note's content MUST be ${validatedCharLimit} characters or less
            2. Extract exactly ${notesPerChunk} most important points from this chunk
            3. Each note should be self-contained and meaningful
            4. Only use "positive", "neutral", or "negative" for sentiment
            5. Include 1-3 relevant tags per note
            6. For exactText, include the EXACT text from the original content that this note is based on (quote)
            7. Leave textPosition as {start: 0, end: 0} - this will be calculated later
            8. Respond with ONLY the JSON object, no other text
            9. The content is from a webpage with title: "${title}" and URL: "${url}"`
          },
          {
            role: "user",
            content: chunk
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const result = completion.choices[0].message.content;
      if (!result) {
        throw new Error('No content in OpenAI response');
      }

      // Parse the result and add the notes
      try {
        const parsedResult = JSON.parse(result);
        if (!parsedResult.notes || !Array.isArray(parsedResult.notes)) {
          throw new Error('Invalid response format from OpenAI');
        }
        
        allNotes = [...allNotes, ...parsedResult.notes];
      } catch (parseError) {
        console.error('Error parsing chunk notes:', parseError);
        // Continue with other chunks instead of failing completely
      }
      
      // If we have enough notes, stop processing more chunks
      if (allNotes.length >= notesCount) {
        break;
      }
    }
    
    // Limit to requested number of notes
    allNotes = allNotes.slice(0, notesCount);
    
    return allNotes;
  } catch (error) {
    console.error('Error generating notes:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { title, content, url, notesCount = 5, noteCharLimit = 280 } = await req.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Generate notes
    const notes = await generateNotesFromContent(title, content, url, notesCount, noteCharLimit);
    
    return NextResponse.json({
      success: true,
      notes,
      count: notes.length
    });
  } catch (error) {
    console.error('Error in generate-project-notes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate notes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 