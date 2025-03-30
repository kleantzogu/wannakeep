-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme TEXT NOT NULL DEFAULT 'dark',
  notes_per_project INTEGER NOT NULL DEFAULT 3,
  note_char_limit INTEGER NOT NULL DEFAULT 280,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT theme_valid CHECK (theme IN ('light', 'dark', 'system')),
  CONSTRAINT notes_per_project_valid CHECK (notes_per_project BETWEEN 1 AND 10),
  CONSTRAINT note_char_limit_valid CHECK (note_char_limit BETWEEN 120 AND 360),
  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- Add RLS (Row Level Security)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for user_settings (users can only access their own settings)
CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 