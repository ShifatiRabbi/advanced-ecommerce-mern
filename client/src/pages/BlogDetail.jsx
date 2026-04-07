import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet }   from 'react-helmet-async';
import api from '../services/api';

export default function BlogDetail() {
  const { slug } = useParams();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn:  () => api.get(`/blog/${slug}`).then(r => r.data.data),
    enabled:  !!slug,
  });

  const { data: relatedData } = useQuery({
    queryKey: ['blog-related', post?.category],
    queryFn:  () => api.get('/blog', { params: { category: post.category, limit: 3, published: 'true' } }).then(r => r.data.data),
    enabled:  !!post?.category,
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}>Loading...</div>;
  if (isError || !post) return <div style={{ textAlign: 'center', padding: 80 }}>Post not found. <Link to="/blog">Back to blog</Link></div>;

  const relatedPosts = relatedData?.posts?.filter(p => p.slug !== slug).slice(0, 3) || [];
  const readTime = Math.max(1, Math.round(post.content?.replace(/<[^>]+>/g, '').split(' ').length / 200));

  return (
    <>
      <Helmet>
        <title>{post.meta?.title || post.title}</title>
        <meta name="description" content={post.meta?.description || post.excerpt} />
        <meta property="og:title"       content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.coverImage?.url && <meta property="og:image" content={post.coverImage.url} />}
        <meta property="og:type" content="article" />
      </Helmet>

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/blog" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>← All posts</Link>
        </div>

        {post.coverImage?.url && (
          <img src={post.coverImage.url} alt={post.title}
            style={{ width: '100%', maxHeight: 440, objectFit: 'cover', borderRadius: 12, marginBottom: 32, display: 'block' }} />
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {post.category && (
            <Link to={`/blog?category=${post.category}`}
              style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 12, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {post.category}
            </Link>
          )}
          <span style={{ fontSize: 13, color: '#9ca3af' }}>
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{readTime} min read
          </span>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px', color: '#111827' }}>{post.title}</h1>

        {post.excerpt && (
          <p style={{ fontSize: 18, color: '#6b7280', lineHeight: 1.7, margin: '0 0 32px', fontStyle: 'italic' }}>{post.excerpt}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
            {(post.author?.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 2px' }}>{post.author?.name || 'ShopBD Team'}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Published author</p>
          </div>
        </div>

        <div className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
          style={{ lineHeight: 1.9, fontSize: 16, color: '#374151' }} />

        {post.tags?.length > 0 && (
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#374151' }}>Tags</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {post.tags.map(tag => (
                <Link key={tag} to={`/blog?search=${tag}`}
                  style={{ padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 20, fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedPosts.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Related Posts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {relatedPosts.map(p => (
                <Link key={p._id} to={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', display: 'block' }}>
                  {p.coverImage?.url && <img src={p.coverImage.url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />}
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3 }}>{p.title}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{new Date(p.publishedAt || p.createdAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <style>{`
        .blog-content h2 { font-size: 24px; font-weight: 800; margin: 32px 0 16px; color: #111827; }
        .blog-content h3 { font-size: 20px; font-weight: 700; margin: 28px 0 12px; color: #111827; }
        .blog-content p  { margin: 0 0 20px; }
        .blog-content ul, .blog-content ol { padding-left: 24px; margin: 0 0 20px; }
        .blog-content li { margin-bottom: 8px; }
        .blog-content a  { color: #1d4ed8; }
        .blog-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 20px; color: #6b7280; margin: 24px 0; }
        .blog-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
        .blog-content pre { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 14px; line-height: 1.6; margin: 20px 0; }
        .blog-content hr  { border: none; border-top: 1px solid #e5e7eb; margin: 32px 0; }
        .blog-content strong { font-weight: 700; color: #111827; }
        .blog-content table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .blog-content th, .blog-content td { padding: 10px 14px; border: 1px solid #e5e7eb; text-align: left; }
        .blog-content th { background: #f9fafb; font-weight: 700; }
      `}</style>
    </>
  );
}