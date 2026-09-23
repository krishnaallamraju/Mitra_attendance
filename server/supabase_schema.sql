-- ==========================================================
-- MITRA Club Attendance Management System
-- Supabase PostgreSQL Schema Definition
-- ==========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CLUBS TABLE
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. USERS TABLE (Admins and Students)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  roll_number TEXT UNIQUE, -- Null for admin, required for student
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  club_name TEXT CHECK (club_name IN ('Vibe Coding', 'AI Team', 'Industry Connect', 'Marketing') OR club_name IS NULL),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 3. STUDENTS VIEW / TABLE (Helper relation)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE NOT NULL,
  club_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  date_str TEXT NOT NULL, -- Format: YYYY-MM-DD
  date DATE NOT NULL,
  time_str TEXT DEFAULT TO_CHAR(NOW(), 'HH24:MI:SS'), -- e.g. "09:30:00"
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
  remarks TEXT DEFAULT '',
  marked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Enforce strictly ONE attendance record per student per date
  CONSTRAINT unique_student_date UNIQUE (student_id, date_str)
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_club_date ON public.attendance(club_name, date_str);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_roll ON public.users(roll_number);

-- 6. SEED DEFAULT CLUBS
INSERT INTO public.clubs (name, code, description)
VALUES 
  ('Vibe Coding', 'VC', 'Software development, modern web apps, and agile coding'),
  ('AI Team', 'AI', 'Machine learning, generative AI models, and deep tech research'),
  ('Industry Connect', 'IC', 'Corporate partnerships, hackathons, and industry mentorship'),
  ('Marketing', 'MKT', 'Club branding, creative design, social media outreach, and event promos')
ON CONFLICT (name) DO NOTHING;
