-- Add exact_text column to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS exact_text TEXT;

-- Update existing notes with empty exact_text
UPDATE public.notes SET exact_text = '' WHERE exact_text IS NULL;

-- Add migration record
INSERT INTO migrations (name, executed_at) 
VALUES ('add_exact_text_to_notes', NOW())
ON CONFLICT (name) DO NOTHING; 