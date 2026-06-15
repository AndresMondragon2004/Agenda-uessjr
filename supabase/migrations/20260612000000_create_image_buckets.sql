-- Create buckets for images if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('ponentes', 'ponentes', true),
    ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for ponentes bucket
CREATE POLICY "Fotos de ponentes son publicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'ponentes');

CREATE POLICY "Admin puede subir fotos de ponentes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ponentes');

-- Policies for logos bucket
CREATE POLICY "Logos de instituciones son publicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Admin puede subir logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos');
