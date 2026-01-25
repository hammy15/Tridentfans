-- Fix: Add INSERT policy for profiles table
-- This allows new users to create their profile during signup

-- Allow users to insert their own profile (id must match their auth.uid())
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Also allow service role to insert profiles (for admin operations)
-- This is handled by the service role key bypassing RLS
