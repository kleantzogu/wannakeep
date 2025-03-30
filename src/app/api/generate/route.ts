import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

// Log the type of API key (without exposing the actual key)
console.log('OpenAI API Key type:', process.env.OPENAI_API_KEY.startsWith('sk-proj-') ? 'Project-scoped key' : 'Regular key')

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

// Generate notes from a text chunk
async function generateNotesFromChunk(textChunk: string, notesPerChunk: number = 1, charLimit: number = 280, chunkStartPosition: number = 0): Promise<any[]> {
  console.log(`Processing chunk with length: ${textChunk.length} characters, starting at position ${chunkStartPosition}`);
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert note extraction assistant with skills in knowledge distillation and summarization. Your task is to extract the most valuable insights from text and create meaningful, concise notes that capture key concepts.
          
          IMPORTANT: You must respond ONLY with a JSON object in this exact format, with no additional text or explanation:
          {
            "notes": [
              {
                "content": "The key insight or information (max ${charLimit} chars)",
                "sentiment": "positive" | "neutral" | "negative",
                "tags": ["relevant", "tags", "max 3 per note"],
                "textPosition": {
                  "start": 34,
                  "end": 109
                },
                "exactText": "the exact text from the source that this note is based on"
              }
            ]
          }

          Rules for high-quality notes:
          1. Each note's content MUST be ${charLimit} characters or less
          2. Extract exactly ${notesPerChunk} most important and distinct points
          3. Focus on actionable insights, key facts, and conceptual understanding
          4. Make each note self-contained and independently valuable
          5. Prioritize depth over breadth - capture nuance when important
          6. Use simple, clear language but preserve technical precision when necessary
          7. For sentiment, use:
             - "positive" for advantageous, beneficial, or optimistic information
             - "neutral" for factual, balanced, or contextual information
             - "negative" for cautionary, problematic, or challenging information
          8. Create specific, relevant tags that categorize the note's domain, topic, and key concepts
          9. For each note's textPosition:
             - "start" must be the character index where the source text for this note begins
             - "end" must be the character index where the source text for this note ends
             - These positions should point to the EXACT source text being referenced
          10. For "exactText", copy the EXACT passage from the source text that your note is based on
          11. Respond with ONLY the JSON object, no other text`
        },
        {
          role: "user",
          content: textChunk
        }
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No content in OpenAI response');
    }

    const parsedResult = JSON.parse(result);
    if (!parsedResult.notes || !Array.isArray(parsedResult.notes)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Adjust text positions based on chunk start position
    const adjustedNotes = parsedResult.notes.map((note: any) => {
      // Only adjust valid positions
      if (note.textPosition && 
          typeof note.textPosition.start === 'number' && 
          typeof note.textPosition.end === 'number') {
        return {
          ...note,
          textPosition: {
            start: note.textPosition.start + chunkStartPosition,
            end: note.textPosition.end + chunkStartPosition
          }
        };
      }
      return note;
    });

    return adjustedNotes;
  } catch (error: any) {
    console.error(`Error processing chunk: ${error.message}`);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    // Log the start of the request
    console.log('Starting /api/generate request');

    const { text, notesPerProject = 3, noteCharLimit = 280 } = await req.json();

    if (!text) {
      console.error('No text provided');
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Validate character limit
    const validatedCharLimit = Math.max(120, Math.min(360, noteCharLimit));

    // Add debug info for API key (safely)
    console.log('API Key Info:', {
      defined: !!process.env.OPENAI_API_KEY,
      type: process.env.OPENAI_API_KEY?.startsWith('sk-proj-') ? 'project-scoped' : 'regular',
      length: process.env.OPENAI_API_KEY?.length || 0,
      truncated: process.env.OPENAI_API_KEY?.substring(0, 8) + '...' // Safe to log first few chars
    });

    console.log('Calling OpenAI API with text length:', text.length);
    console.log('OpenAI configuration:', { 
      usingProjectKey: process.env.OPENAI_API_KEY?.startsWith('sk-proj-') || false,
      hasOrgId: !!process.env.OPENAI_ORG_ID
    });

    try {
      // Initialize response stream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Split text into chunks
            const textChunks = chunkText(text);
            console.log(`Text split into ${textChunks.length} chunks`);
            
            // Calculate how many notes to extract from each chunk to meet the total
            const notesPerChunk = Math.max(1, Math.ceil(notesPerProject / textChunks.length));
            console.log(`Extracting ${notesPerChunk} notes per chunk to meet target of ${notesPerProject} total notes`);
            
            let allNotes: any[] = [];
            let chunkStartPosition = 0;
            
            // Process each chunk
            for (let i = 0; i < textChunks.length; i++) {
              console.log(`Processing chunk ${i+1} of ${textChunks.length}`);
              const chunk = textChunks[i];
              
              try {
                const chunkNotes = await generateNotesFromChunk(
                  chunk, 
                  notesPerChunk, 
                  validatedCharLimit,
                  chunkStartPosition
                );
                allNotes = [...allNotes, ...chunkNotes];
                
                console.log(`Successfully extracted ${chunkNotes.length} notes from chunk ${i+1}`);
              } catch (chunkError: any) {
                console.error(`Error processing chunk ${i+1}:`, chunkError.message);
                // Continue with other chunks instead of failing completely
              }
              
              // Update the start position for the next chunk
              chunkStartPosition += chunk.length;
              
              // If we have enough notes, stop processing more chunks
              if (allNotes.length >= notesPerProject) {
                break;
              }
            }
            
            // Limit to requested number of notes
            allNotes = allNotes.slice(0, notesPerProject);
            
            if (allNotes.length === 0) {
              throw new Error('Failed to generate any notes from the text');
            }
            
            console.log(`Successfully generated ${allNotes.length} notes in total`);
            
            // Sort notes by their position in the text (start with earlier content)
            allNotes.sort((a, b) => {
              const aPos = a.textPosition?.start || 0;
              const bPos = b.textPosition?.start || 0;
              return aPos - bPos;
            });
            
            console.log('Notes sorted by text position');
            
            // Stream the notes
            for (const note of allNotes) {
              try {
                // Ensure note object is properly sanitized before sending
                const sanitizedNote = {
                  content: note.content || "",
                  sentiment: note.sentiment || "neutral",
                  tags: Array.isArray(note.tags) ? note.tags : [],
                  textPosition: note.textPosition || { start: 0, end: 0 },
                  exactText: note.exactText || ""
                };
                
                // Properly stringify with error handling
                const noteJson = JSON.stringify({ note: sanitizedNote });
                controller.enqueue(encoder.encode(`data: ${noteJson}\n\n`));
                
                // Add a small delay between notes for visual effect
                await new Promise(resolve => setTimeout(resolve, 300));
              } catch (encodeError) {
                console.error('Error encoding note:', encodeError);
                // Continue with other notes instead of breaking the stream
              }
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (streamError) {
            console.error('Error in stream processing:', streamError);
            controller.error(streamError);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (openaiError: any) {
      // More detailed error logging for OpenAI API issues
      console.error('OpenAI API Error Details:', {
        error: openaiError,
        message: openaiError.message,
        status: openaiError.status,
        statusText: openaiError.statusText,
        headers: openaiError.headers,
        response: openaiError.response?.data,
        type: openaiError.type,
        code: openaiError.code,
        param: openaiError.param
      });
      
      // Check for specific error types
      if (openaiError.status === 401) {
        return NextResponse.json(
          { 
            error: 'Authentication error with OpenAI',
            details: 'Please check your API key is correct and has proper permissions',
          },
          { status: 401 }
        );
      } else if (openaiError.status === 429) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded with OpenAI',
            details: 'Your application has hit rate limits with the OpenAI API',
          },
          { status: 429 }
        );
      } else if (openaiError.code === 'context_length_exceeded') {
        return NextResponse.json(
          { 
            error: 'Text too long for OpenAI API',
            details: 'The file is too large to process. Please try a smaller file.',
          },
          { status: 413 }
        );
      }
      
      // Return a user-friendly error for any other case
      return NextResponse.json(
        { 
          error: 'OpenAI API Error', 
          details: openaiError.message || 'Unknown error',
          code: openaiError.code || null,
          status: openaiError.status || null
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in /api/generate:', error);
    // Return a more detailed error message
    return NextResponse.json(
      { 
        error: 'Failed to generate notes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 