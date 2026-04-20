import { useRef, useState } from 'react';
import { useProductImportExport } from '../../hooks/useProductImportExport';
import { toast } from '../../utils/toast';

const EXPORT_FORMATS = [
  { id: 'shopify', label: 'Shopify CSV' },
  { id: 'woocommerce', label: 'WooCommerce / WordPress (Woo CSV)' },
];

const IMPORT_FORMATS = [
  { id: 'shopify', label: 'Shopify product CSV' },
  { id: 'woocommerce', label: 'WooCommerce export CSV' },
  { id: 'wordpress', label: 'WordPress (same as WooCommerce CSV)' },
];

export default function ProductImportExportPanel() {
  const { exportMutation, importMutation } = useProductImportExport();
  const [exportFmt, setExportFmt] = useState('shopify');
  const [importFmt, setImportFmt] = useState('shopify');
  const fileRef = useRef(null);

  return (
    <section style={s.section} className="admin-product-import-export-panel" id="admin-product-import-export-panel">
      <div style={s.head}>
        <h3 style={s.title}>Import / export</h3>
        <p style={s.sub}>
          CSV columns are aligned with{' '}
          <strong>Shopify&apos;s product CSV</strong> and{' '}
          <strong>WooCommerce standard export</strong>. Use{' '}
          <strong>Type</strong> (Shopify) or <strong>Categories</strong> (Woo) so products map to an existing category name in this store.
          Optional <strong>App Product ID</strong> column (on files exported from here) updates the same product on re-import.
        </p>
      </div>
      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.cardTitle}>Export</div>
          <label style={s.lbl}>Format</label>
          <select value={exportFmt} onChange={(e) => setExportFmt(e.target.value)} style={s.select}>
            {EXPORT_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <button
            type="button"
            style={s.primary}
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate(exportFmt)}
          >
            {exportMutation.isPending ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>Import</div>
          <label style={s.lbl}>Source format</label>
          <select value={importFmt} onChange={(e) => setImportFmt(e.target.value)} style={s.select}>
            {IMPORT_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={s.file} />
          <button
            type="button"
            style={s.primary}
            disabled={importMutation.isPending}
            onClick={() => {
              const f = fileRef.current?.files?.[0];
              if (!f) {
                toast.error('Choose a CSV file first');
                return;
              }
              importMutation.mutate({ format: importFmt, file: f });
            }}
          >
            {importMutation.isPending ? 'Importing…' : 'Upload & import'}
          </button>
        </div>
      </div>
    </section>
  );
}

const s = {
  section:   { marginBottom: 24, padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10 },
  head:      { marginBottom: 14 },
  title:     { margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#111827' },
  sub:       { margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 },
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card:      { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4 },
  lbl:       { fontSize: 12, fontWeight: 600, color: '#6b7280' },
  select:    { padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 },
  file:      { fontSize: 13 },
  primary:   { marginTop: 4, padding: '10px 14px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
};
