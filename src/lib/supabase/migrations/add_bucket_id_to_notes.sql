-- Add bucket_id column to notes table
ALTER TABLE public.notes
ADD COLUMN bucket_id UUID REFERENCES public.buckets(id) ON DELETE SET NULL;

-- Update RLS policies to allow bucket operations
CREATE POLICY "Users can update notes in buckets they own"
  ON public.notes
  FOR UPDATE
  USING (
    bucket_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.buckets
      WHERE buckets.id = notes.bucket_id
    )
  ); 