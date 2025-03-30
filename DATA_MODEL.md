# Wannakeep Data Model

## Entity Relationship Diagram

```
+-------------+       +-------------+       +-------------+
|  profiles   |       |    notes    |       |    tags     |
+-------------+       +-------------+       +-------------+
| id          |<----->| user_id     |       | id          |
| email       |       | id          |<----->| user_id     |
| created_at  |       | title       |       | name        |
| updated_at  |       | content     |       | created_at  |
+-------------+       | sentiment   |       +-------------+
                      | created_at  |             ^
                      | updated_at  |             |
                      +-------------+             |
                            ^                     |
                            |                     |
                            |                     |
                      +-------------+             |
                      | notes_tags  |             |
                      +-------------+             |
                      | id          |             |
                      | note_id     |-------------+
                      | tag_id      |
                      | created_at  |
                      +-------------+
                            ^
                            |
                            |
                      +-------------+
                      | references  |
                      +-------------+
                      | id          |
                      | note_id     |
                      | source_type |
                      | source_url  |
                      | source_name |
                      | page_number |
                      | timestamp   |
                      | created_at  |
                      | updated_at  |
                      +-------------+
```

## Tables Description

### profiles
This table extends the auth.users table from Supabase Auth and stores additional user information.

| Column     | Type                    | Description                     |
|------------|-------------------------|---------------------------------|
| id         | UUID (PK, FK)           | Unique identifier, references auth.users(id) |
| email      | TEXT                    | User's email address            |
| created_at | TIMESTAMP WITH TIME ZONE | When the profile was created    |
| updated_at | TIMESTAMP WITH TIME ZONE | When the profile was last updated |

### notes
Stores the user's notes with their content and metadata.

| Column       | Type                    | Description                     |
|-------------|-------------------------|---------------------------------|
| id          | UUID (PK)               | Unique identifier for the note  |
| user_id     | UUID (FK)               | References profiles(id)         |
| title       | TEXT                    | Note title                      |
| content     | TEXT                    | The main content of the note    |
| sentiment   | TEXT                    | Either 'positive', 'neutral', or 'negative' |
| is_bookmarked| BOOLEAN                | Whether the note is bookmarked  |
| created_at  | TIMESTAMP WITH TIME ZONE | When the note was created       |
| updated_at  | TIMESTAMP WITH TIME ZONE | When the note was last updated  |

### tags
Stores user-defined tags for categorizing notes.

| Column     | Type                    | Description                     |
|------------|-------------------------|---------------------------------|
| id         | UUID (PK)               | Unique identifier for the tag   |
| user_id    | UUID (FK)               | References profiles(id)         |
| name       | TEXT                    | Tag name                        |
| created_at | TIMESTAMP WITH TIME ZONE | When the tag was created        |

### notes_tags
Junction table for the many-to-many relationship between notes and tags.

| Column     | Type                    | Description                     |
|------------|-------------------------|---------------------------------|
| id         | UUID (PK)               | Unique identifier               |
| note_id    | UUID (FK)               | References notes(id)            |
| tag_id     | UUID (FK)               | References tags(id)             |
| created_at | TIMESTAMP WITH TIME ZONE | When the relationship was created |

### references
Stores references to external sources for notes.

| Column      | Type                    | Description                     |
|-------------|-------------------------|---------------------------------|
| id          | UUID (PK)               | Unique identifier               |
| note_id     | UUID (FK)               | References notes(id)            |
| source_type | TEXT                    | Type of source (URL, PDF, etc.) |
| source_url  | TEXT                    | URL of the source if applicable |
| source_name | TEXT                    | Name of the source              |
| page_number | INTEGER                 | Page number if applicable       |
| timestamp   | TEXT                    | Timestamp if applicable         |
| created_at  | TIMESTAMP WITH TIME ZONE | When the reference was created  |
| updated_at  | TIMESTAMP WITH TIME ZONE | When the reference was last updated |
``` 