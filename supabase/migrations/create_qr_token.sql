-- Añadir la columna qr_token a la tabla estudiantes
ALTER TABLE estudiantes 
ADD COLUMN IF NOT EXISTS qr_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Si por alguna razón los estudiantes antiguos tenían NULL (por un default omitido), aseguramos que todos tengan su token:
UPDATE estudiantes SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;
