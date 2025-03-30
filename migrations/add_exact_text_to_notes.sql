-- Add exact_text column to notes table
ALTER TABLE notes ADD COLUMN exact_text TEXT;

-- Update existing notes with empty exact_text
UPDATE notes SET exact_text = '' WHERE exact_text IS NULL;

-- Add migration record
INSERT INTO migrations (name, executed_at) 
VALUES ('add_exact_text_to_notes', NOW())
ON CONFLICT (name) DO NOTHING; 