import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import api from '../services/api';
// import { toast } from 'react-hot-toast';
import { toast } from '../utils/toast';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function ContactPage() {
  const settings = useSiteSettings();
  const siteName = settings?.siteName || 'ShopBD';
  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ['page', 'contact'],
    queryFn: () => api.get('/pages/contact').then(r => r.data.data),
    staleTime: 1000 * 60 * 10,
  });

  const extra = page?.extra || {};
  const contactDetails = [
    { label: 'Phone', value: extra.phone || settings?.phone, icon: '📞' },
    { label: 'Email', value: extra.email || settings?.email || settings?.adminEmail, icon: '📧' },
    { label: 'Address', value: extra.address || settings?.siteAddress, icon: '📍' },
  ].filter((r) => r.value);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  // 1. Define the Submission Mutation
  const submitMutation = useMutation({
    mutationFn: (payload) => api.post('/contact', payload),
    onSuccess: () => {
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', phone: '', message: '' });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to send message';
      toast.error(msg);
    },
  });

  // 2. Updated HandleSend Logic
  const handleSend = () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.email.trim()) return toast.error('Email is required');
    if (!form.message.trim()) return toast.error('Message is required');

    submitMutation.mutate(form);
  };

  if (pageLoading) return <div style={{ padding: 100, textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="client-page-contact-page" id="client-page-contact-page">
      <Helmet><title>{page?.title || `Contact Us - ${siteName}`}</title></Helmet>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>{page?.title || 'Contact Us'}</h1>
        {page?.content && <p style={{ color: 'var(--color-text-muted, #6b7280)', marginBottom: 40, fontSize: 16 }}>{page.content}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Send us a message</h2>
            
            <div>
              {[
                { k: 'name', label: 'Name *', type: 'text', ph: 'Your name' },
                { k: 'email', label: 'Email *', type: 'email', ph: 'your@email.com' },
                { k: 'phone', label: 'Phone', type: 'tel', ph: '01XXXXXXXXX' },
                { k: 'message', label: 'Message *', type: 'textarea' },
              ].map(f => (
                <div key={f.k} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--color-text, #374151)' }}>{f.label}</label>
                  {f.type === 'textarea'
                    ? <textarea 
                        value={form[f.k]} 
                        onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                        rows={5} 
                        placeholder="Your message..." 
                        style={{ ...inp, height: 120, resize: 'vertical' }} 
                      />
                    : <input 
                        type={f.type} 
                        value={form[f.k]} 
                        onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                        placeholder={f.ph} 
                        style={inp} 
                      />}
                </div>
              ))}
              
              <button 
                onClick={handleSend}
                disabled={submitMutation.isPending}
                style={{
                  padding: '12px 28px',
                  background: submitMutation.isPending ? 'var(--color-text-muted, #9ca3af)' : 'var(--color-primary, #111827)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: submitMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: 15,
                  fontWeight: 600
                }}
              >
                {submitMutation.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Contact details</h2>
            {contactDetails.map(row => (
              <div key={row.label} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>{row.icon}</span>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted, #9ca3af)', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</p>
                  <p style={{ fontSize: 15, margin: 0, fontWeight: 500 }}>{row.value}</p>
                </div>
              </div>
            ))}
            {contactDetails.length === 0 && (
              <p style={{ color: 'var(--color-text-muted, #9ca3af)', fontSize: 14 }}>
                Contact information will appear here after adding phone/email/address in admin settings.
              </p>
            )}

            {extra.socials && Object.entries(extra.socials).filter(([, v]) => v).length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--color-text, #374151)' }}>Follow us</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {Object.entries(extra.socials).filter(([, v]) => v).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noreferrer"
                      style={{ padding: '6px 14px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 20, fontSize: 13, color: 'var(--color-text, #374151)', textDecoration: 'none', textTransform: 'capitalize' }}>
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {extra.mapEmbed && (
              <div style={{ marginTop: 24, borderRadius: 'var(--card-radius, 10px)', overflow: 'hidden', border: 'var(--card-border, 1px solid #e5e7eb)' }}>
                <iframe src={extra.mapEmbed} width="100%" height="260" style={{ border: 0, display: 'block' }}
                  allowFullScreen loading="lazy" title="Location map" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = { width: '100%', padding: '10px 12px', border: '1px solid var(--color-border, #d1d5db)', borderRadius: 'var(--input-radius, 8px)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: 'var(--color-text, #111827)', background: 'var(--color-background, #fff)' };