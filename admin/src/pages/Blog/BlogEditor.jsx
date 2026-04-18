import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export default function BlogEditor() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const isEdit   = !!id;

  const { data: post } = useQuery({
    queryKey: ['blog-edit', id],
    queryFn:  () => api.get(`/blog/admin/all`).then(r => r.data.data.posts.find(p => p._id === id)),
    enabled:  isEdit,
  });

  const [form, setForm] = useState({
    title: '', content: '', excerpt: '', category: 'General', tags: '',
    isPublished: false, metaTitle: '', metaDesc: '', coverImageUrl: '', coverImagePublicId: '',
  });
  const contentRef = useRef(null);
  const [preview, setPreview]     = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  useEffect(() => {
    if (post) {
      setForm({
        title:       post.title || '',
        content:     post.content || '',
        excerpt:     post.excerpt || '',
        category:    post.category || 'General',
        tags:        post.tags?.join(', ') || '',
        isPublished: post.isPublished || false,
        metaTitle:   post.meta?.title || '',
        metaDesc:    post.meta?.description || '',
        coverImageUrl: post.coverImage?.url || '',
        coverImagePublicId: post.coverImage?.public_id || '',
      });
    }
  }, [post]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!form.title) return;
    const timer = setTimeout(() => {
      localStorage.setItem('blog_draft', JSON.stringify(form));
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 3000);
    return () => clearTimeout(timer);
  }, [form]);

  const coverUploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('cover', file);
      return api.post('/blog/upload-cover', fd);
    },
    onSuccess: (res) => {
      const d = res.data?.data;
      if (d?.url) {
        setForm((f) => ({ ...f, coverImageUrl: d.url, coverImagePublicId: d.public_id || '' }));
      }
    },
    onError: (err) => alert(err.response?.data?.message || 'Image upload failed'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/blog/${id}`, data) : api.post('/blog', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      localStorage.removeItem('blog_draft');
      navigate('/blog');
    },
    onError: (err) => alert(err.response?.data?.message || 'Save failed'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generateMeta = () => {
    const title = form.title.slice(0, 60);
    const desc  = form.excerpt?.slice(0, 160) || (form.content?.replace(/<[^>]+>/g, '').slice(0, 160) + '...');
    set('metaTitle', title);
    set('metaDesc', desc);
  };

  const handleSave = (publish = null) => {
    if (!form.title.trim()) return alert('Title is required');
    if (!form.content.trim()) return alert('Content is required');
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      title:       form.title,
      content:     form.content,
      excerpt:     form.excerpt,
      category:    form.category,
      tags,
      isPublished: publish !== null ? publish : form.isPublished,
      meta:        { title: form.metaTitle, description: form.metaDesc },
    };
    if (form.coverImageUrl) {
      payload.coverImage = {
        url: form.coverImageUrl,
        ...(form.coverImagePublicId && { public_id: form.coverImagePublicId }),
      };
    }
    saveMutation.mutate(payload);
  };

  const applyWrap = useCallback((openTag, closeTag, emptyPlaceholder) => {
    const el = contentRef.current;
    setForm((f) => {
      const content = f.content;
      let start = 0;
      let end = 0;
      if (el) {
        start = el.selectionStart ?? 0;
        end = el.selectionEnd ?? 0;
      } else {
        start = end = content.length;
      }
      const selected = content.slice(start, end);
      const middle = selected || emptyPlaceholder || '';
      const piece = openTag + middle + closeTag;
      const next = content.slice(0, start) + piece + content.slice(end);
      queueMicrotask(() => {
        if (!el) return;
        el.focus();
        if (selected) {
          const innerStart = start + openTag.length;
          el.setSelectionRange(innerStart, innerStart + selected.length);
        } else if (emptyPlaceholder) {
          const innerStart = start + openTag.length;
          el.setSelectionRange(innerStart, innerStart + emptyPlaceholder.length);
        } else {
          const pos = start + piece.length;
          el.setSelectionRange(pos, pos);
        }
      });
      return { ...f, content: next };
    });
  }, []);

  const insertAtCursor = useCallback((snippet) => {
    const el = contentRef.current;
    setForm((f) => {
      const content = f.content;
      if (!el) {
        return { ...f, content: content + snippet };
      }
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const next = content.slice(0, start) + snippet + content.slice(end);
      queueMicrotask(() => {
        el.focus();
        const pos = start + snippet.length;
        el.setSelectionRange(pos, pos);
      });
      return { ...f, content: next };
    });
  }, []);

  const INSERT_FORMATS = [
    {
      label: 'H2',
      fn: () => {
        const el = contentRef.current;
        const hasSel = el && el.selectionStart !== el.selectionEnd;
        if (hasSel) applyWrap('<h2>', '</h2>', 'Heading');
        else insertAtCursor('\n<h2>Heading</h2>\n');
      },
    },
    {
      label: 'H3',
      fn: () => {
        const el = contentRef.current;
        const hasSel = el && el.selectionStart !== el.selectionEnd;
        if (hasSel) applyWrap('<h3>', '</h3>', 'Subheading');
        else insertAtCursor('\n<h3>Subheading</h3>\n');
      },
    },
    { label: 'Bold',    fn: () => applyWrap('<strong>', '</strong>', 'bold text') },
    { label: 'Italic',  fn: () => applyWrap('<em>', '</em>', 'italic text') },
    { label: 'Link',    fn: () => applyWrap('<a href="https://">', '</a>', 'link text') },
    {
      label: 'Image',
      fn: () => applyWrap(
        '\n<img src="',
        '" alt="" style="max-width:100%;border-radius:8px;" />\n',
        'https://',
      ),
    },
    {
      label: 'List',
      fn: () => {
        const el = contentRef.current;
        setForm((f) => {
          const content = f.content;
          let start = 0;
          let end = 0;
          if (el) {
            start = el.selectionStart ?? 0;
            end = el.selectionEnd ?? 0;
          } else start = end = content.length;
          const selected = content.slice(start, end);
          let block;
          if (selected.trim()) {
            const lines = selected.split('\n').map((l) => l.trim()).filter(Boolean);
            const lis = (lines.length ? lines : ['Item']).map((l) => `  <li>${l}</li>`).join('\n');
            block = `<ul>\n${lis}\n</ul>\n`;
          } else {
            block = '\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n';
          }
          const next = content.slice(0, start) + block + content.slice(end);
          queueMicrotask(() => {
            if (el) {
              el.focus();
              const pos = start + block.length;
              el.setSelectionRange(pos, pos);
            }
          });
          return { ...f, content: next };
        });
      },
    },
    {
      label: 'Quote',
      fn: () => applyWrap(
        '\n<blockquote style="border-left:4px solid #e5e7eb;padding-left:16px;color:#6b7280;margin:16px 0;">',
        '</blockquote>\n',
        'Quote text here',
      ),
    },
    {
      label: 'Code',
      fn: () => applyWrap(
        '\n<pre style="background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:8px;overflow-x:auto;"><code>',
        '</code></pre>\n',
        'code here',
      ),
    },
    { label: 'Divider', fn: () => insertAtCursor('\n<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />\n') },
  ];

  return (
    <div className="admin-page-blog-blog-editor" id="admin-page-blog-blog-editor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/blog')} style={{ padding: '7px 14px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>← Back</button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{isEdit ? 'Edit Post' : 'New Blog Post'}</h2>
          {autoSaved && <span style={{ fontSize: 12, color: '#059669' }}>Draft auto-saved</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPreview(v => !v)}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: preview ? '#f3f4f6' : '#fff', cursor: 'pointer', fontSize: 14 }}>
            {preview ? 'Editor' : 'Preview'}
          </button>
          <button onClick={() => handleSave(false)} disabled={saveMutation.isPending}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
            Save Draft
          </button>
          <button onClick={() => handleSave(true)} disabled={saveMutation.isPending}
            style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            {saveMutation.isPending ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Post title..."
            style={{ width: '100%', fontSize: 26, fontWeight: 700, border: 'none', borderBottom: '2px solid #e5e7eb', padding: '8px 0', marginBottom: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827' }} />

          {!preview ? (
            <>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {INSERT_FORMATS.map(f => (
                  <button key={f.label} onClick={f.fn}
                    style={{ padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <textarea
                ref={contentRef}
                value={form.content}
                onChange={e => set('content', e.target.value)}
                placeholder="Write your post content here... You can use HTML tags for formatting."
                style={{ width: '100%', minHeight: 450, padding: '14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'monospace', lineHeight: 1.7, outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#111827' }} />
            </>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, minHeight: 450 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{form.title || 'Post title'}</h1>
              {form.coverImageUrl && <img src={form.coverImageUrl} alt="" style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 8, marginBottom: 20 }} />}
              <div dangerouslySetInnerHTML={{ __html: form.content || '<p style="color:#9ca3af">No content yet.</p>' }}
                style={{ lineHeight: 1.8, fontSize: 15, color: '#374151' }} />
            </div>
          )}
        </div>

        <div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Status</h3>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, padding: '4px 10px', borderRadius: 20, background: form.isPublished ? '#d1fae5' : '#fef9c3', color: form.isPublished ? '#065f46' : '#854d0e', fontWeight: 600 }}>
                {form.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} />
              Mark as published
            </label>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Cover image</h3>
            <input
              type="file"
              accept="image/*"
              id="blog-cover-upload"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) coverUploadMutation.mutate(file);
              }}
            />
            <label htmlFor="blog-cover-upload">
              <span style={{ ...s.label, marginBottom: 8 }}>Upload</span>
              <div
                style={{
                  padding: '12px 16px',
                  border: '2px dashed #d1d5db',
                  borderRadius: 8,
                  textAlign: 'center',
                  cursor: coverUploadMutation.isPending ? 'wait' : 'pointer',
                  background: '#fafafa',
                  fontSize: 13,
                  color: '#374151',
                  fontWeight: 600,
                }}
              >
                {coverUploadMutation.isPending ? 'Uploading…' : 'Choose image file'}
              </div>
            </label>
            {form.coverImageUrl && (
              <img src={form.coverImageUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, marginTop: 10 }} onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Categorize</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} style={s.input} placeholder="e.g. News, Tips" />
            </div>
            <div style={{ marginBottom: 0 }}>
              <label style={s.label}>Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} style={s.input} placeholder="ecommerce, tips, bangladesh" />
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Excerpt</h3>
            <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
              placeholder="Short summary shown on blog listing..."
              rows={3} style={{ ...s.input, height: 70, resize: 'vertical' }} />
          </div>

          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>SEO meta</h3>
              <button onClick={generateMeta}
                style={{ padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Auto-generate
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>Meta title <span style={{ color: '#9ca3af', fontSize: 11 }}>({form.metaTitle.length}/60)</span></label>
              <input value={form.metaTitle} onChange={e => set('metaTitle', e.target.value)} style={s.input} maxLength={60} />
            </div>
            <div>
              <label style={s.label}>Meta description <span style={{ color: '#9ca3af', fontSize: 11 }}>({form.metaDesc.length}/160)</span></label>
              <textarea value={form.metaDesc} onChange={e => set('metaDesc', e.target.value)}
                rows={3} style={{ ...s.input, height: 70, resize: 'vertical' }} maxLength={160} />
            </div>
            {form.metaTitle && (
              <div style={{ marginTop: 12, padding: 10, background: '#f9fafb', borderRadius: 6, fontSize: 12 }}>
                <p style={{ color: '#1d4ed8', fontWeight: 600, margin: '0 0 2px' }}>{form.metaTitle}</p>
                <p style={{ color: '#059669', margin: '0 0 2px', fontSize: 11 }}>shopbd.com/blog/{form.title?.toLowerCase().replace(/\s+/g,'-')}</p>
                <p style={{ color: '#6b7280', margin: 0 }}>{form.metaDesc}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  card:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: 700, margin: '0 0 12px' },
  label:     { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' },
  input:     { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
};