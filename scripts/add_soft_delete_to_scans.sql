-- Add soft delete column to scans table
ALTER TABLE scans ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_scans_is_deleted ON scans(is_deleted);
