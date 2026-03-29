-- Unplug Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '😀',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  dti_type TEXT -- Detox Type Indicator (DOOM, FOMO, MOOD, BUSY, CHILL, ZEN)
);

-- Challenges table
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('reduce_percent', 'max_hours', 'no_sns_hours')),
  goal_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  penalty TEXT,
  reward TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress table (daily screen time logs)
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes INTEGER NOT NULL,
  screenshot_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, date) -- One entry per member per day
);

-- Nudges table
CREATE TABLE nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  message TEXT DEFAULT 'Hey, you''re spending too much time on your phone!',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for better query performance
CREATE INDEX idx_members_group_id ON members(group_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_challenges_group_id ON challenges(group_id);
CREATE INDEX idx_challenges_active ON challenges(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_progress_group_id ON progress(group_id);
CREATE INDEX idx_progress_member_id ON progress(member_id);
CREATE INDEX idx_progress_date ON progress(date);
CREATE INDEX idx_nudges_to_member ON nudges(to_member_id);
CREATE INDEX idx_groups_code ON groups(code);

-- Enable Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Groups: Anyone can read, authenticated users can create
CREATE POLICY "Groups are viewable by everyone" ON groups
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Group members can update their group" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.group_id = groups.id
      AND members.user_id = auth.uid()
    )
  );

-- Members: Anyone can read, anyone can join (for MVP simplicity)
CREATE POLICY "Members are viewable by everyone" ON members
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join a group" ON members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Members can update their own profile" ON members
  FOR UPDATE USING (user_id = auth.uid());

-- Challenges: Group members can manage
CREATE POLICY "Challenges are viewable by everyone" ON challenges
  FOR SELECT USING (true);

CREATE POLICY "Group members can create challenges" ON challenges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.group_id = challenges.group_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can update challenges" ON challenges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.group_id = challenges.group_id
      AND members.user_id = auth.uid()
    )
  );

-- Progress: Group members can view, own member can update
CREATE POLICY "Progress is viewable by group members" ON progress
  FOR SELECT USING (true);

CREATE POLICY "Members can log their own progress" ON progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = progress.member_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update their own progress" ON progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = progress.member_id
      AND members.user_id = auth.uid()
    )
  );

-- Nudges: Group members can send and receive
CREATE POLICY "Nudges are viewable by sender and receiver" ON nudges
  FOR SELECT USING (true);

CREATE POLICY "Members can send nudges" ON nudges
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = nudges.from_member_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Recipients can update nudges (mark as read)" ON nudges
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = nudges.to_member_id
      AND members.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for groups updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE progress;
ALTER PUBLICATION supabase_realtime ADD TABLE nudges;
