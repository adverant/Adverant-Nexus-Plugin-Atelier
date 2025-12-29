-- Nexus-Atelier Database Schema
-- Migration 001: Initial Schema

-- Create schema
CREATE SCHEMA IF NOT EXISTS atelier;

-- Set search path
SET search_path TO atelier, public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table (all generation jobs)
CREATE TABLE atelier.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID,
  type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'image', 'audio', 'workflow')),
  status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  params JSONB NOT NULL,
  result JSONB,
  error JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  model_used VARCHAR(100),
  cost_usd DECIMAL(10, 6),
  duration_ms INTEGER,
  credits_used INTEGER DEFAULT 0,
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES atelier.projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_jobs_user_status ON atelier.jobs(user_id, status);
CREATE INDEX idx_jobs_project ON atelier.jobs(project_id);
CREATE INDEX idx_jobs_created ON atelier.jobs(created_at DESC);
CREATE INDEX idx_jobs_status_priority ON atelier.jobs(status, priority DESC);
CREATE INDEX idx_jobs_type ON atelier.jobs(type);

-- Projects table
CREATE TABLE atelier.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[],
  brand_guidelines JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON atelier.projects(user_id);
CREATE INDEX idx_projects_created ON atelier.projects(created_at DESC);
CREATE INDEX idx_projects_tags ON atelier.projects USING GIN(tags);

-- Add foreign key constraint for jobs.project_id
-- (deferred until after projects table creation)

-- Assets table
CREATE TABLE atelier.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID,
  job_id UUID,
  type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'image', 'audio')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB,
  file_size BIGINT,
  duration_seconds DECIMAL(10, 2),
  resolution VARCHAR(20),
  format VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES atelier.projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES atelier.jobs(id) ON DELETE SET NULL
);

CREATE INDEX idx_assets_user_project ON atelier.assets(user_id, project_id);
CREATE INDEX idx_assets_type ON atelier.assets(type);
CREATE INDEX idx_assets_created ON atelier.assets(created_at DESC);
CREATE INDEX idx_assets_job ON atelier.assets(job_id);

-- Personalization profiles
CREATE TABLE atelier.personalization_profiles (
  user_id UUID PRIMARY KEY,
  ratings_count INTEGER DEFAULT 0,
  style_preferences JSONB,
  favorite_models TEXT[],
  preferred_quality VARCHAR(50),
  avg_rating DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset ratings (for personalization learning)
CREATE TABLE atelier.asset_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES atelier.assets(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_asset UNIQUE (user_id, asset_id)
);

CREATE INDEX idx_ratings_user ON atelier.asset_ratings(user_id);
CREATE INDEX idx_ratings_asset ON atelier.asset_ratings(asset_id);

-- Model performance tracking
CREATE TABLE atelier.model_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER,
  avg_cost_usd DECIMAL(10, 6),
  avg_quality_score DECIMAL(3, 2),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_model_task UNIQUE (model_name, task_type)
);

CREATE INDEX idx_model_perf_model ON atelier.model_performance(model_name);
CREATE INDEX idx_model_perf_task ON atelier.model_performance(task_type);

-- Storyboards (for video timeline workflows)
CREATE TABLE atelier.storyboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_duration_seconds DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES atelier.projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_storyboards_user ON atelier.storyboards(user_id);
CREATE INDEX idx_storyboards_project ON atelier.storyboards(project_id);

-- Storyboard scenes
CREATE TABLE atelier.storyboard_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storyboard_id UUID NOT NULL,
  sequence_order INTEGER NOT NULL,
  name VARCHAR(255),
  description TEXT,
  duration_seconds DECIMAL(10, 2),
  asset_id UUID,
  job_id UUID,
  camera_settings JSONB,
  transition_in VARCHAR(50),
  transition_out VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_storyboard FOREIGN KEY (storyboard_id) REFERENCES atelier.storyboards(id) ON DELETE CASCADE,
  CONSTRAINT fk_asset FOREIGN KEY (asset_id) REFERENCES atelier.assets(id) ON DELETE SET NULL,
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES atelier.jobs(id) ON DELETE SET NULL,
  CONSTRAINT unique_storyboard_sequence UNIQUE (storyboard_id, sequence_order)
);

CREATE INDEX idx_scenes_storyboard ON atelier.storyboard_scenes(storyboard_id, sequence_order);

-- Usage tracking (for billing)
CREATE TABLE atelier.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  credits_charged INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user_date ON atelier.usage_tracking(user_id, created_at DESC);
CREATE INDEX idx_usage_resource ON atelier.usage_tracking(resource_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION atelier.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON atelier.projects
  FOR EACH ROW EXECUTE FUNCTION atelier.update_updated_at_column();

CREATE TRIGGER update_personalization_updated_at BEFORE UPDATE ON atelier.personalization_profiles
  FOR EACH ROW EXECUTE FUNCTION atelier.update_updated_at_column();

CREATE TRIGGER update_model_perf_updated_at BEFORE UPDATE ON atelier.model_performance
  FOR EACH ROW EXECUTE FUNCTION atelier.update_updated_at_column();

CREATE TRIGGER update_storyboards_updated_at BEFORE UPDATE ON atelier.storyboards
  FOR EACH ROW EXECUTE FUNCTION atelier.update_updated_at_column();

-- Comments for documentation
COMMENT ON SCHEMA atelier IS 'Nexus-Atelier: AI-Powered Creative Production Platform';
COMMENT ON TABLE atelier.jobs IS 'All generation jobs (video, image, audio, workflow)';
COMMENT ON TABLE atelier.projects IS 'User projects for organizing creative work';
COMMENT ON TABLE atelier.assets IS 'Generated assets (videos, images, audio files)';
COMMENT ON TABLE atelier.personalization_profiles IS 'User personalization learning data';
COMMENT ON TABLE atelier.asset_ratings IS 'User ratings for personalization';
COMMENT ON TABLE atelier.model_performance IS 'Model performance tracking for smart routing';
COMMENT ON TABLE atelier.storyboards IS 'Video storyboard timelines';
COMMENT ON TABLE atelier.storyboard_scenes IS 'Individual scenes in storyboards';
