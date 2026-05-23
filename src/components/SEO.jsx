import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, keywords, ogImage, ogUrl }) {
  const defaultTitle = "Jornada Académica y Cultural 2026 | UESSJR";
  const defaultDescription = "Plataforma oficial de la 12va Jornada Académica y Cultural de la UESS San José del Rincón. Consulta la agenda, inscríbete a sesiones y obtén tu ticket digital.";
  const defaultImage = "https://ydcybysimlvatvadpbaz.supabase.co/storage/v1/object/public/images/ues-sjr.png";
  const defaultUrl = "https://agenda-uessjr.vercel.app/";

  const finalTitle = title ? `${title} | UESSJR` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = ogImage || defaultImage;
  const finalUrl = ogUrl || defaultUrl;

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={finalUrl} />
      <meta property="twitter:title" content={finalTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={finalImage} />
    </Helmet>
  );
}
