import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('Fetching content from:', url);
    
    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }

    // Get text content
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;
    
    // Basic content extraction - this is a simple approach
    // A more robust approach would use a proper HTML parser like cheerio
    let content = '';
    
    // Extract text from paragraph tags
    const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi);
    if (paragraphs) {
      content = paragraphs
        .map(p => p.replace(/<[^>]*>/g, '')) // Remove HTML tags
        .join('\n\n');
    }
    
    // If no paragraphs found, try to get text from body
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
          .replace(/<[^>]*>/g, ' ')                                          // Remove HTML tags
          .replace(/\s+/g, ' ')                                              // Replace multiple spaces with one
          .trim();
      }
    }
    
    return NextResponse.json({
      success: true,
      title,
      content,
      url
    });
  } catch (error) {
    console.error('Error scraping URL:', error);
    return NextResponse.json(
      { error: 'Failed to scrape URL content' },
      { status: 500 }
    );
  }
} 