import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';

export default function BlogList() {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage]         = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['blog-list', page, search, category],
    queryFn:  () => api.get('/blog', { params: { page, limit: 9, published: 'true', category: category || undefined, search: search || undefined } }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const { data: catList } = useQuery({
    queryKey: ['blog-categories'],
    queryFn:  () => api.get('/blog').then(r => {
      const cats = [...new Set(r.data.data.posts.map(p => p.category).filter(Boolean))];
      return cats;
    }),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="client-page-blog-list" id="client-page-blog-list">
      <Helmet><title>Blog — ShopBD</title></Helmet>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>Blog</h1>
        <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 16 }}>Tips, news, and stories from our team</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search posts..." style={{ padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, width: 240, outline: 'none' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => { setCategory(''); setPage(1); }}
              style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 20, background: !category ? '#111827' : '#fff', color: !category ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
              All
            </button>
            {catList?.map(cat => (
              <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                style={{ padding: '7px 14px', border: '1px solid #e5e7eb', borderRadius: 20, background: category === cat ? '#111827' : '#fff', color: category === cat ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? <p style={{ textAlign: 'center', padding: 60 }}>Loading...</p> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, marginBottom: 40 }}>
              {data?.posts?.map(post => (
                <article key={post._id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                  {post.coverImage?.url ? (
                    <Link to={`/blog/${post.slug}`}>
                      <img src={post.coverImage.url} alt={post.title} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                    </Link>
                  ) : (
                    <div style={{ height: 8, background: '#111827' }} />
                  )}
                  <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {post.category && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {post.category}
                        </span>
                      )}
                      {post.tags?.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: 11, padding: '3px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 12 }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3, color: '#111827' }}>{post.title}</h2>
                      <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, margin: '0 0 16px' }}>
                        {post.excerpt || post.content?.replace(/<[^>]+>/g, '').slice(0, 120) + '...'}
                      </p>
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>
                        {post.author?.name || 'ShopBD'} · {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <Link to={`/blog/${post.slug}`} style={{ fontSize: 13, color: '#111827', fontWeight: 600, textDecoration: 'none' }}>
                        Read →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {data?.posts?.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: 60, fontSize: 16 }}>No posts found.</p>
            )}

            {data?.pagination?.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)}
                    style={{ width: 36, height: 36, border: '1px solid #e5e7eb', borderRadius: 8, background: page === pg ? '#111827' : '#fff', color: page === pg ? '#fff' : '#374151', cursor: 'pointer', fontSize: 14, fontWeight: page === pg ? 700 : 400 }}>
                    {pg}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}