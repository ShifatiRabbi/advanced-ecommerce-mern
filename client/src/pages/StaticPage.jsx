import { useParams } from 'react-router-dom';
import { useQuery }  from '@tanstack/react-query';
import { Helmet }    from 'react-helmet-async';
import api from '../services/api';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function StaticPage({ pageKey }) {
  const settings = useSiteSettings();
  const siteName = settings?.siteName || 'ShopBD';
  const { key: paramKey } = useParams();
  const key = pageKey || paramKey;

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', key],
    queryFn:  () => api.get(`/pages/${key}`).then(r=>r.data.data),
    enabled:  !!key,
    staleTime: 1000*60*10,
  });

  if (isLoading) return <div style={{padding:80,textAlign:'center', color: 'var(--color-text-muted, #6b7280)'}}>Loading...</div>;
  if (!page)     return <div style={{padding:80,textAlign:'center', color: 'var(--color-text-muted, #6b7280)'}}>Page not found.</div>;

  return (
    <div className="client-page-static-page" id="client-page-static-page">
      <Helmet>
        <title>{page.metaTitle || `${page.title} - ${siteName}`}</title>
        {page.metaDesc && <meta name="description" content={page.metaDesc} />}
      </Helmet>
      <div style={{maxWidth:860,margin:'0 auto',padding:'48px 24px', color: 'var(--color-text, #111827)'}}>
        <h1 style={{fontSize:32,fontWeight:800,marginBottom:32,color:'var(--color-text, #111827)'}}>{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.content }}
          style={{lineHeight:1.8,fontSize:15,color:'var(--color-text, #374151)'}} />
      </div>
    </div>
  );
}