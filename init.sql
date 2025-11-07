-- PostgreSQL Database Schema

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  question_format TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_format IN ('multiple_choice', 'statement')),
  question_text TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER NOT NULL CHECK (points IN (10, 15, 20)),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_format ON questions(question_format);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);

-- Insert initial categories
INSERT INTO categories (name, description) VALUES
  ('Current Affairs', 'Latest news and events from India and around the world'),
  ('India GK', 'General Knowledge about India - Geography, Polity, Governance'),
  ('History', 'Indian History - Ancient, Medieval, Modern and Freedom Struggle'),
  ('Economy', 'Indian Economy - Development, Banking, Fiscal Policy'),
  ('News This Month', 'Current month news and trending events'),
  ('News Last 3 Months', 'News and events from last 3 months')
ON CONFLICT (name) DO NOTHING;

