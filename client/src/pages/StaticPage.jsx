import { useParams } from 'react-router-dom';
import { useQuery }  from '@tanstack/react-query';
import { Helmet }    from 'react-helmet-async';
import api from '../services/api';

export default function StaticPage({ pageKey }) {
  const { key: paramKey } = useParams();
  const key = pageKey || paramKey;

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', key],
    queryFn:  () => api.get(`/pages/${key}`).then(r=>r.data.data),
    enabled:  !!key,
    staleTime: 1000*60*10,
  });

  if (isLoading) return <div style={{padding:80,textAlign:'center'}}>Loading...</div>;
  if (!page)     return <div style={{padding:80,textAlign:'center'}}>Page not found.</div>;

  return (
    <div className="client-page-static-page" id="client-page-static-page">
      <Helmet>
        <title>{page.metaTitle || page.title}</title>
        {page.metaDesc && <meta name="description" content={page.metaDesc} />}
      </Helmet>
      <div style={{maxWidth:860,margin:'0 auto',padding:'48px 24px'}}>
        <h1 style={{fontSize:32,fontWeight:800,marginBottom:32}}>{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.content }}
          style={{lineHeight:1.8,fontSize:15,color:'#374151'}} />
      </div>
    </div>
  );
}