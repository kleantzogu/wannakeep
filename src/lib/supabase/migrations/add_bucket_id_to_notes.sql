-- Add bucket_id column to notes table
ALTER TABLE public.notes
ADD COLUMN bucket_id UUID REFERENCES public.buckets(id) ON DELETE SET NULL;

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update notes in buckets they own" ON public.notes;

-- Create a new policy that allows users to update their own notes
CREATE POLICY "Users can update their own notes"
  ON public.notes
  FOR UPDATE
  USING (auth.uid() = user_id); 