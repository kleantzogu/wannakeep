-- Add emoji column to buckets table
ALTER TABLE public.buckets
ADD COLUMN emoji text DEFAULT '📁';

-- Update existing buckets to have the default emoji
UPDATE public.buckets
SET emoji = '📁'
WHERE emoji IS NULL; 