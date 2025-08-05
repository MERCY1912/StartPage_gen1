/*
  # Create user usage tracking table

  1. New Tables
    - `user_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, nullable for anonymous users)
      - `anonymous_id` (text, for tracking anonymous users before registration)
      - `request_date` (date, the date of usage)
      - `request_count` (integer, number of requests made on that date)
      - `is_premium` (boolean, whether user has premium subscription)
      - `premium_expires_at` (timestamptz, when premium subscription expires)
      - `created_at` (timestamptz, when record was created)
      - `updated_at` (timestamptz, when record was last updated)

  2. Security
    - Enable RLS on `user_usage` table
    - Add policies for users to read/write their own data
    - Add policies for anonymous users to read/write their anonymous data

  3. Indexes
    - Index on user_id and request_date for fast lookups
    - Index on anonymous_id and request_date for anonymous users
*/

-- Create the user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id text,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0,
  is_premium boolean NOT NULL DEFAULT false,
  premium_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can read own usage data"
  ON user_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage data"
  ON user_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage data"
  ON user_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for anonymous users (using anonymous_id)
CREATE POLICY "Anonymous users can read own usage data"
  ON user_usage
  FOR SELECT
  TO anon
  USING (user_id IS NULL AND anonymous_id IS NOT NULL);

CREATE POLICY "Anonymous users can insert usage data"
  ON user_usage
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

CREATE POLICY "Anonymous users can update own usage data"
  ON user_usage
  FOR UPDATE
  TO anon
  USING (user_id IS NULL AND anonymous_id IS NOT NULL)
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_date 
  ON user_usage(user_id, request_date);

CREATE INDEX IF NOT EXISTS idx_user_usage_anonymous_date 
  ON user_usage(anonymous_id, request_date);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();