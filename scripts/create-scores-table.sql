-- Create user_scores table for Body Score System
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal_score INT NOT NULL CHECK (meal_score >= 0 AND meal_score <= 100),
  daily_score INT,
  body_score INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own scores"
  ON user_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores"
  ON user_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON user_scores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_scores_user_date 
  ON user_scores(user_id, date DESC);
