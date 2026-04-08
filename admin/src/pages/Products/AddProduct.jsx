import { useState } from 'react';
import { useNavigate }     from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api                 from '../../services/api';
import { toast }           from '../../utils/toast';
import { validateSchema, required, minLen, maxLen, min } from '../../utils/validate';

const PRODUCT_SCHEMA = {
  name:        [v => required(v, 'Name'), v => minLen(v, 3, 'Name'), v => maxLen(v, 200, 'Name')],
  price:       [v => required(v, 'Price'), v => min(Number(v), 1, 'Price')],
  stock:       [v => required(v, 'Stock'), v => min(Number(v), 0, 'Stock')],
  category:    [v => required(v, 'Category')],
  description: [v => required(v, 'Description'), v => minLen(v, 10, 'Description'), v => maxLen(v, 5000, 'Description')],
  shortDesc:   [v => v && maxLen(v, 300, 'Short description')].filter(Boolean),
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name:'', description:'', shortDesc:'', price:'', discountPrice:'', category:'', brand:'', stock:'', sku:'', isActive:true, isFeatured:false, metaTitle:'', metaDesc:'' });
  const [images, setImages]   = useState([]);
  const [fieldErrors, setFE]  = useState({});

  const { data: categories } = useQuery({ queryKey:['cats'],   queryFn:()=>api.get('/categories').then(r=>r.data.data) });
  const { data: brands }     = useQuery({ queryKey:['brands'], queryFn:()=>api.get('/brands').then(r=>r.data.data) });

  const mutation = useMutation({
    mutationFn: (fd) => api.post('/products', fd, { headers:{'Content-Type':'multipart/form-data'} }),
    onSuccess: () => {
      toast.success('Product created successfully!');
      navigate('/products');
    },
    onError: (err) => {
      // Handle BE validation errors
      const data = err?.response?.data;
      if (data?.errors?.length) {
        const beErrors = Object.fromEntries(data.errors.map(e => [e.field, e.message.replace(/^"[^"]*"\s*/,'')]));
        setFE(beErrors);
        toast.fromApiError(err);
      } else {
        toast.error(data?.message || 'Failed to create product');
      }
    },
  });

  const set = (k, v) => {
    setForm(f => ({...f, [k]:v}));
    setFE(e => { const n={...e}; delete n[k]; return n; });
  };

  const handleSubmit = () => {
    // FE validation first
    const { errors, isValid } = validateSchema(form, PRODUCT_SCHEMA);
    if (!isValid) {
      setFE(errors);
      toast.error(Object.values(errors).join(' • '));
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => {
      if (k === 'metaTitle') { fd.append('meta[title]', v); return; }
      if (k === 'metaDesc')  { fd.append('meta[description]', v); return; }
      if (v !== '' && v !== null) fd.append(k, v);
    });
    images.forEach(img => fd.append('images', img));
    mutation.mutate(fd);
  };

  const F = ({ k, label, type='text', ph='', textarea=false, required=false }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}{required&&<span style={{color:'#dc2626'}}> *</span>}</label>
      {textarea
        ? <textarea value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}
            style={{...s.input, height:100, resize:'vertical', ...(fieldErrors[k]&&{borderColor:'#ef4444'})}} />
        : <input type={type} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}
            style={{...s.input, ...(fieldErrors[k]&&{borderColor:'#ef4444'})}} />}
      {fieldErrors[k] && <p style={{fontSize:12,color:'#dc2626',marginTop:4}}>⚠ {fieldErrors[k]}</p>}
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:24}}>
        <h2 style={{margin:0}}>Add Product</h2>
        <button onClick={()=>navigate('/products')} style={s.backBtn}>← Back</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:20}}>
        <div>
          <div style={s.card}>
            <h3 style={s.h3}>Basic information</h3>
            <F k="name"        label="Product name"     ph="Samsung Galaxy S24"  required />
            <F k="shortDesc"   label="Short description (max 300 chars)" ph="One-line summary..." textarea />
            <F k="description" label="Full description"  ph="Detailed content..." textarea required />
          </div>
          <div style={s.card}>
            <h3 style={s.h3}>Pricing & stock</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <F k="price"          label="Price (৳) *"          type="number" ph="1999" required />
              <F k="discountPrice"  label="Discount price (৳)"   type="number" ph="1499" />
              <F k="stock"          label="Stock quantity *"      type="number" ph="100"  required />
              <F k="sku"            label="SKU"                               ph="SKU-001" />
            </div>
          </div>
        </div>
        <div>
          <div style={s.card}>
            <h3 style={s.h3}>Category & brand</h3>
            <div style={{marginBottom:12}}>
              <label style={s.label}>Category <span style={{color:'#dc2626'}}>*</span></label>
              <select value={form.category} onChange={e=>set('category',e.target.value)}
                style={{...s.input,...(fieldErrors.category&&{borderColor:'#ef4444'})}}>
                <option value="">Select category</option>
                {categories?.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {fieldErrors.category && <p style={{fontSize:12,color:'#dc2626',marginTop:4}}>⚠ {fieldErrors.category}</p>}
            </div>
            <div>
              <label style={s.label}>Brand</label>
              <select value={form.brand} onChange={e=>set('brand',e.target.value)} style={s.input}>
                <option value="">Select brand</option>
                {brands?.map(b=><option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div style={s.card}>
            <h3 style={s.h3}>Images</h3>
            <div onClick={()=>document.getElementById('pimgs').click()}
              style={{border:'2px dashed #d1d5db',borderRadius:8,padding:20,textAlign:'center',cursor:'pointer'}}>
              <p style={{color:images.length?'#059669':'#9ca3af',margin:0,fontSize:14}}>
                {images.length ? `${images.length} image(s) selected` : 'Click to upload images'}
              </p>
            </div>
            <input id="pimgs" type="file" multiple accept="image/*" style={{display:'none'}} onChange={e=>setImages(Array.from(e.target.files))} />
            {images.length>0 && (
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
                {images.map((img,i)=>(
                  <img key={i} src={URL.createObjectURL(img)} alt="" style={{width:56,height:56,objectFit:'cover',borderRadius:6,border:'1px solid #eee'}} />
                ))}
              </div>
            )}
          </div>

          <div style={s.card}>
            <h3 style={s.h3}>Status</h3>
            {[{k:'isActive',l:'Active (visible on store)'},{k:'isFeatured',l:'Featured product'}].map(f=>(
              <label key={f.k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,cursor:'pointer',fontSize:14}}>
                <input type="checkbox" checked={!!form[f.k]} onChange={e=>set(f.k,e.target.checked)} />
                {f.l}
              </label>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={mutation.isPending}
            style={{width:'100%',padding:14,background:'#111827',color:'#fff',border:'none',borderRadius:8,fontSize:15,fontWeight:600,cursor:mutation.isPending?'not-allowed':'pointer',opacity:mutation.isPending?.7:1}}>
            {mutation.isPending ? '⟳ Creating...' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  backBtn: {padding:'8px 16px',border:'1px solid #d1d5db',borderRadius:8,background:'#fff',cursor:'pointer',fontSize:14},
  card:    {background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:20,marginBottom:16},
  h3:      {fontSize:15,fontWeight:700,margin:'0 0 14px'},
  label:   {display:'block',fontSize:13,fontWeight:600,marginBottom:5,color:'#374151'},
  input:   {width:'100%',padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit'},
};