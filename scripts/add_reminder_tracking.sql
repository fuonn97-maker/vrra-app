-- Add reminder tracking fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_scan_date DATE,
ADD COLUMN IF NOT EXISTS last_reminder_sent_time TIME,
ADD COLUMN IF NOT EXISTS reminder_shown_today BOOLEAN DEFAULT false;

-- Update existing records with today's date if they have scans
UPDATE profiles p
SET last_scan_date = CURRENT_DATE
WHERE EXISTS (
  SELECT 1 FROM scans s 
  WHERE s.user_id = p.id 
  AND DATE(s.created_at) = CURRENT_DATE
);
