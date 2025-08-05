/*
  # Update usage limits system

  1. Changes
    - Remove premium-related functionality
    - Simplify to basic usage tracking
    - Anonymous users: 5 requests per day
    - Registered users: 10 requests per day

  2. Security
    - Keep existing RLS policies
    - Maintain data integrity
*/

-- No structural changes needed to the table
-- The existing table structure supports the new simplified system
-- Premium fields will remain but won't be used

-- Update any existing premium users to regular users (optional cleanup)
UPDATE user_usage 
SET is_premium = false, premium_expires_at = null 
WHERE is_premium = true;