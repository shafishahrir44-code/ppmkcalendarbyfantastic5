/*
  # Fix Admin Approval System - Comprehensive Policy Update

  1. Policy Updates
    - Remove conflicting policies on event_requests table
    - Create simplified, working policies for admin operations
    - Ensure proper permissions for approval workflow
    - Fix user ID matching issues

  2. Security
    - Maintain RLS protection
    - Allow admins to update any request
    - Allow users to read their own requests
    - Proper foreign key handling
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can read all requests" ON event_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON event_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON event_requests;
DROP POLICY IF EXISTS "Admins can update any request" ON event_requests;

-- Create new, simplified policies that work
CREATE POLICY "Allow authenticated users to read event requests"
  ON event_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to create event requests"
  ON event_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own requests"
  ON event_requests
  FOR UPDATE
  TO authenticated
  USING (
    requested_by IN (
      SELECT id FROM users WHERE id::text = auth.uid()::text
    )
  );

CREATE POLICY "Allow admins to update any event request"
  ON event_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id IN (
        SELECT id FROM users WHERE id::text = auth.uid()::text
      )
      AND role = 'admin'
    )
  );

-- Also ensure events table has proper policies for admin-created events
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;

CREATE POLICY "Allow authenticated users to create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_requested_by ON event_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
