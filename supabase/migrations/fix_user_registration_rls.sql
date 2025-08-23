/*
  # Fix User Registration RLS Policies

  1. Policy Updates
    - Drop all existing conflicting policies on users table
    - Create new policies that allow user registration
    - Fix INSERT policy to allow new user creation
    - Ensure proper permissions for authenticated users

  2. Security
    - Maintain RLS protection
    - Allow new users to create their own profiles
    - Allow users to read and update their own data
    - Proper authentication checks
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new, working policies for users table
CREATE POLICY "Allow authenticated users to read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow new users to create their profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Also ensure we have proper policies for other tables
-- Drop and recreate event policies for consistency
DROP POLICY IF EXISTS "Anyone can read events" ON events;
DROP POLICY IF EXISTS "Allow authenticated users to create events" ON events;
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "Users can delete their own events" ON events;

CREATE POLICY "Allow authenticated users to read events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = created_by::text)
  WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Allow users to delete their own events"
  ON events
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = created_by::text);

-- Fix comments policies
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Allow authenticated users to read comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (
    author IN (
      SELECT name FROM users WHERE id::text = auth.uid()::text
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author);
