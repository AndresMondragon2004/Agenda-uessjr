-- Habilitar Realtime para las nuevas tablas Pro
ALTER PUBLICATION supabase_realtime ADD TABLE public.sesion_encuestas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sesion_networking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sesion_preguntas; -- Asegurándonos por si acaso
