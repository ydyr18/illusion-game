-- Create the games table
CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  host_id text,
  players jsonb DEFAULT '[]'::jsonb, -- Array of { id, name, score, isHost }
  state jsonb DEFAULT '{}'::jsonb, -- The game state object
  last_updated timestamptz DEFAULT now()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;

-- Enable RLS (Row Level Security) but allow public access for this demo
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.games
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.games
  FOR UPDATE USING (true);

