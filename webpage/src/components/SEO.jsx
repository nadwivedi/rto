import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, name, type, url, keywords }) {
  const siteUrl = 'https://rtosarthi.in'; // Replace with actual domain when known
  const fullUrl = `${siteUrl}${url || ''}`;
  
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title} | RTO Sarthi</title>
      <meta name='description' content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Set canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* End standard metadata tags */}
      
      {/* Facebook tags */}
      <meta property="og:type" content={type || "website"} />
      <meta property="og:title" content={`${title} | RTO Sarthi`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="RTO Sarthi" />
      {/* End Facebook tags */}
      
      {/* Twitter tags */}
      <meta name="twitter:creator" content={name || "SoftwareBytes"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${title} | RTO Sarthi`} />
      <meta name="twitter:description" content={description} />
      {/* End Twitter tags */}
    </Helmet>
  );
}
