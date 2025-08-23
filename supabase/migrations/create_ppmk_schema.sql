/*
  # Create PPMK Calendar Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `username` (text, unique)
      - `role` (text, enum: user/admin)
      - `created_at` (timestamp)
    
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (date)
      - `time` (text)
      - `venue` (text)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
    
    - `comments`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `text` (text)
      - `author` (text)
      - `created_at` (timestamp)
    
    - `event_requests`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (date)
      - `time` (text)
      - `venue` (text)
      - `requested_by` (uuid, foreign key to users)
      - `status` (text, enum: pending/approved/denied)
      - `admin_notes` (text)
      - `reviewed_by` (uuid, foreign key to users)
      - `reviewed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin-specific policies for event_requests
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied');

-- Users table (streamlined - no name column)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  time text NOT NULL,
  venue text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  text text NOT NULL,
  author text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Event requests table
CREATE TABLE IF NOT EXISTS event_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  time text NOT NULL,
  venue text DEFAULT '',
  requested_by uuid REFERENCES users(id) ON DELETE CASCADE,
  status request_status DEFAULT 'pending',
  admin_notes text DEFAULT '',
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_requests ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Events policies
CREATE POLICY "Anyone can read events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Users can update their own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = created_by::text);

CREATE POLICY "Users can delete their own events"
  ON events
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = created_by::text);

-- Comments policies
CREATE POLICY "Anyone can read comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (author = (SELECT username FROM users WHERE id::text = auth.uid()::text));

-- Event requests policies
CREATE POLICY "Users can read all requests"
  ON event_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own requests"
  ON event_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = requested_by::text);

CREATE POLICY "Users can update their own requests"
  ON event_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = requested_by::text);

CREATE POLICY "Admins can update any request"
  ON event_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );
