/*
  # Community Forum Database Schema

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `author` (text)
      - `created_at` (timestamp)
    - `replies`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `content` (text)
      - `author` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for authenticated users to create posts/replies
*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author text NOT NULL DEFAULT 'Anonymous',
  created_at timestamptz DEFAULT now()
);

-- Create replies table
CREATE TABLE IF NOT EXISTS replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  author text NOT NULL DEFAULT 'Anonymous',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create posts"
  ON posts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for replies
CREATE POLICY "Anyone can read replies"
  ON replies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create replies"
  ON replies
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS replies_post_id_idx ON replies(post_id);
CREATE INDEX IF NOT EXISTS replies_created_at_idx ON replies(created_at DESC);