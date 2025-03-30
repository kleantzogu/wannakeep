-- Check if buckets table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'buckets'
);

-- If table exists, show its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'buckets';

-- Check RLS policies
SELECT *
FROM pg_policies
WHERE tablename = 'buckets'
AND schemaname = 'public';

-- Check if table has any data
SELECT COUNT(*) as bucket_count
FROM public.buckets; 