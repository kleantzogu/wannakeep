import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import pdf from 'pdf-parse';

export async function POST(req: Request) {
  try {
    // Get the file from the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    try {
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Parse PDF content to text
      const data = await pdf(buffer);
      const text = data.text;

      // Generate a unique ID for the file
      const fileId = `pdf_${Date.now()}`;

      // Store the file in Supabase storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${fileId}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, buffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        if (uploadError.message.includes('bucket not found')) {
          return NextResponse.json(
            { error: 'Storage not configured' },
            { status: 500 }
          );
        }
        throw uploadError;
      }

      return NextResponse.json({
        success: true,
        text,
        filename: file.name,
        fileId,
        storagePath: filePath
      });
    } catch (parseError) {
      console.error('Error parsing PDF:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse PDF file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in PDF handler:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF file' },
      { status: 500 }
    );
  }
} 