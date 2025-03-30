#!/bin/bash

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install

# Step 2: Display instructions for setting up Supabase tables
echo "============================================================"
echo "IMPORTANT: Set up Supabase Tables"
echo "============================================================"
echo "Before continuing, please set up your Supabase database tables:"
echo "1. Go to https://app.supabase.com and open your project"
echo "2. Navigate to SQL Editor"
echo "3. Create a new query and paste the contents of schema.sql"
echo "4. Run the query to create all necessary tables"
echo "5. Make sure your .env.local file has the correct Supabase URL and anon key"
echo "============================================================"
echo "Press Enter to continue..."
read

# Step 3: Run the development server
echo "Starting Wannakeep app..."
npm run dev 