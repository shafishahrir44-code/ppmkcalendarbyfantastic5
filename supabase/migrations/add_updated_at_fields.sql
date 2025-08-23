/*
  # Add missing updated_at fields and fix triggers

  1. Schema Updates
    - Add `updated_at` column to all tables that need it
    - Create trigger function to automatically update `updated_at`
    - Apply triggers to relevant tables

  2. Fixes
    - Resolves "record 'new' has no field 'updated_at'" error
    - Ensures proper timestamp tracking for updates
    - Maintains data consistency
*/

-- Add updated_at column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at column to events table if it doesn't exist  
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at column to comments table if it doesn't exist
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add updated_at column to event_requests table if it doesn't exist
ALTER TABLE event_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_event_requests_updated_at ON event_requests;

-- Create triggers for all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_requests_updated_at
  BEFORE UPDATE ON event_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have updated_at = created_at initially
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE events SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE comments SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE event_requests SET updated_at = created_at WHERE updated_at IS NULL;
