
CREATE TABLE public.skills_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon text,
  provider text,
  config_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_official boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills_catalog TO authenticated, anon;
GRANT ALL ON public.skills_catalog TO service_role;
ALTER TABLE public.skills_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse skills" ON public.skills_catalog FOR SELECT USING (true);
CREATE POLICY "Admins manage skills" ON public.skills_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER skills_catalog_updated BEFORE UPDATE ON public.skills_catalog
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills_catalog(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_skills TO authenticated;
GRANT ALL ON public.user_skills TO service_role;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own skills" ON public.user_skills FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_skills_updated BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.skills_catalog (slug, name, description, category, icon, provider, config_schema) VALUES
('web-search', 'Web Search', 'Let models search the live web for fresh information.', 'Research', 'Globe', 'Nexus', '[]'::jsonb),
('image-generation', 'Image Generation', 'Generate images with Gemini and Flux from any chat.', 'Creative', 'Image', 'Nexus', '[]'::jsonb),
('http-fetch', 'HTTP Fetch', 'Fetch any public URL and return parsed content.', 'Developer', 'Link', 'Nexus', '[]'::jsonb),
('code-interpreter', 'Code Interpreter', 'Run Python in a sandbox for data analysis and charts.', 'Developer', 'Terminal', 'Nexus', '[]'::jsonb),
('gmail', 'Gmail', 'Read, search, and send email from your Gmail account.', 'Productivity', 'Mail', 'Google',
  '[{"key":"api_key","label":"OAuth token","type":"password","required":true}]'::jsonb),
('google-calendar', 'Google Calendar', 'Read events and create meetings on your calendar.', 'Productivity', 'Calendar', 'Google',
  '[{"key":"api_key","label":"OAuth token","type":"password","required":true}]'::jsonb),
('notion', 'Notion', 'Search pages, read databases, and create notes in Notion.', 'Knowledge', 'FileText', 'Notion',
  '[{"key":"api_key","label":"Integration secret","type":"password","required":true}]'::jsonb),
('slack', 'Slack', 'Post messages and read channels in your Slack workspace.', 'Communication', 'MessageCircle', 'Slack',
  '[{"key":"bot_token","label":"Bot token","type":"password","required":true},{"key":"default_channel","label":"Default channel","type":"text"}]'::jsonb),
('github', 'GitHub', 'Search repos, read code, and open issues or PRs.', 'Developer', 'Github', 'GitHub',
  '[{"key":"api_key","label":"Personal access token","type":"password","required":true}]'::jsonb),
('linear', 'Linear', 'Create and update Linear issues from chat.', 'Developer', 'CheckSquare', 'Linear',
  '[{"key":"api_key","label":"API key","type":"password","required":true}]'::jsonb);
