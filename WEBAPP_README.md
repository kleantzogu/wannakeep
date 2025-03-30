# Wannakeep Web Application

This document outlines the functionality of the Wannakeep web application, focusing on the note management features.

## Core Features

### Notes Management
- **Create Notes**: Add new notes with a title, content, and tags
- **View Notes**: Visual sticky notes interface showing your notes at a glance
- **Edit Notes**: Update existing notes with new content, tags, or information
- **Delete Notes**: Remove notes you no longer need

### Organization
- **Tagging System**: Add tags to notes for categorization
- **Sentiment Analysis**: Notes are automatically color-coded based on sentiment:
  - Green: Positive
  - Blue: Neutral
  - Red: Negative
- **Filtering & Search**: Filter notes by tags, sentiment, or search for specific content

## Pages

### `/notes`
The main notes dashboard with a two-column layout:
- Left: Detailed note content (when selected)
- Right: Visual sticky notes view with color-coded sentiment

### `/notes/new`
Create a new note with:
- Title input
- Content textarea
- Tag management
- Live sentiment analysis preview

### `/notes/[id]`
View and edit a specific note:
- Read mode with note details and sentiment preview
- Edit mode with the full note editor

### `/settings`
Manage application settings:
- Appearance preferences
- Data export options
- Application information

## Using the Notes Features

### Creating a Note
1. Click the "+ Create Note" button in the sidebar or "New Note" button in the notes page
2. Enter a title and content
3. Add tags by typing in the tag field and pressing Enter or clicking Add
4. Note's sentiment will be automatically detected
5. Click "Save Note" to save

### Filtering Notes
Use the filters at the top of the notes page to:
- Search for notes by title or content
- Filter by specific tags
- Filter by sentiment (positive, neutral, negative)

### Organization Tips
- Use consistent tags for better organization
- Use the sentiment color-coding to quickly identify note types
- Click on tags in the sidebar to see all notes with that tag

## Current Limitations

As this is a development version, there are a few limitations:
- Data is currently stored in memory and will be lost on page refresh (will be connected to Supabase in production)
- File imports (PDF, text) are not yet implemented
- Collaborative features are planned for future versions 