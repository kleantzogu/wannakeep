# Wannakeep

A note-keeping and organization app designed to save users countless hours by efficiently capturing, organizing, and managing notes from various sources.

## Overview

Wannakeep visually represents notes as color-coded sticky notes, organized by sentiment, tags, and references to help users quickly capture and organize information from diverse sources like meetings, PDFs, and text files.

## Features

### Core Features
1. **Note Creation**
   - Text input manually or automatically generated from recordings
   - Import from PDFs, text files, ebooks

2. **Visual Organization**
   - Sticky-note visual format
   - Color-coded sentiment classification:
     - Green: Positive
     - Blue: Neutral
     - Red: Negative

3. **Tagging and Reference**
   - Customizable tagging for quick retrieval
   - Reference source tracking (URL, file name, timestamp)

4. **Search and Filtering**
   - Powerful keyword search functionality
   - Advanced filtering by tags, sentiments, or references

## Technical Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS, shadcn UI Components
- **Backend**: Supabase for Authentication, Storage, and Database

## Getting Started

### Prerequisites

- Node.js >= 18.17.0

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/wannakeep.git
cd wannakeep
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Rename `.env.example` to `.env.local` and update the following:
```
NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[INSERT SUPABASE PROJECT API ANON KEY]
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

- `src/app`: Main application pages and routes
- `src/components`: Reusable UI components 
- `src/utils`: Utility functions and helpers
- `src/hooks`: Custom React hooks

## Current Status

This project is in active development. MVP features include:
- Note creation with basic tagging
- Sticky-note visualizations
- Sentiment analysis and color-coding

## License

This project is licensed under the MIT License.
