import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import api, { setAccessToken } from '../services/api';
import { useAuthStore }        from '../store/authStore';
import { useCartStore }        from '../store/cartStore';

export default function UserDashboard() {
  const navigate        = useNavigate();
  const { user, setUser, clearUser } = useAuthStore();
  const [tab, setTab]   = useState('orders');
  const [editForm, setEditForm] = useState({ name: user?.name||'', phone: user?.phone||'' });

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders-dash'],
    queryFn:  () => api.get('/orders/my?limit=20').then(r=>r.data.data),
    enabled: !!user,
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist-dash'],
    queryFn:  () => api.get('/wishlist').then(r=>r.data.data),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/auth/me', data),
    onSuccess:  (res) => { setUser(res.data.data); alert('Profile updated!'); },
    onError:    (err) => alert(err.response?.data?.message || 'Update failed'),
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setAccessToken(null);
    clearUser();
    useCartStore.getState().clearCart();
    navigate('/');
  };

  if (!user) return (
    <div style={{textAlign:'center',padding:80}}>
      <p style={{marginBottom:16}}>Please sign in to view your dashboard.</p>
      <button onClick={()=>navigate('/login')} style={{padding:'10px 24px',background:'#111827',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>Sign In</button>
    </div>
  );

  const TABS = [
    {key:'orders',  label:'My Orders'},
    {key:'wishlist',label:'Wishlist'},
    {key:'profile', label:'Profile'},
  ];

  const STATUS_COLORS = {
    pending:{bg:'#fef9c3',color:'#854d0e'}, confirmed:{bg:'#dbeafe',color:'#1e40af'},
    shipped:{bg:'#e0f2fe',color:'#0369a1'}, delivered:{bg:'#dcfce7',color:'#166534'},
    cancelled:{bg:'#fee2e2',color:'#991b1b'},
  };

  return (
    <div style={{maxWidth:1000,margin:'0 auto',padding:'32px 24px'}} className="client-page-user-dashboard" id="client-page-user-dashboard">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:700,margin:'0 0 4px'}}>My Account</h1>
          <p style={{color:'#6b7280',margin:0,fontSize:14}}>{user.email}</p>
        </div>
        <button onClick={handleLogout} style={{padding:'8px 16px',border:'1px solid #d1d5db',borderRadius:8,background:'#fff',cursor:'pointer',fontSize:14,color:'#374151'}}>
          Sign Out
        </button>
      </div>

      <div style={{display:'flex',gap:4,marginBottom:24}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{padding:'8px 20px',border:'1px solid #e5e7eb',borderRadius:20,background:tab===t.key?'#111827':'#fff',color:tab===t.key?'#fff':'#374151',cursor:'pointer',fontSize:14}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div>
          {ordersData?.orders?.length === 0 ? (
            <div style={{textAlign:'center',padding:60}}>
              <p style={{color:'#9ca3af',marginBottom:16}}>No orders yet.</p>
              <button onClick={()=>navigate('/shop')} style={{padding:'10px 24px',background:'#111827',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}}>Start Shopping</button>
            </div>
          ) : ordersData?.orders?.map(order=>{
            const col = STATUS_COLORS[order.status] || {bg:'#f3f4f6',color:'#374151'};
            return (
              <div key={order._id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:20,marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div>
                    <span style={{fontFamily:'monospace',fontWeight:700,fontSize:15}}>{order.orderNumber}</span>
                    <span style={{fontSize:13,color:'#9ca3af',marginLeft:12}}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span style={{padding:'4px 12px',borderRadius:20,fontSize:13,fontWeight:600,background:col.bg,color:col.color}}>
                    {order.status.charAt(0).toUpperCase()+order.status.slice(1)}
                  </span>
                </div>
                <div style={{display:'flex',gap:10,marginBottom:12}}>
                  {order.items?.slice(0,3).map((item,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                      {item.image && <img src={item.image} alt="" style={{width:44,height:44,objectFit:'cover',borderRadius:6}}/>}
                      <div>
                        <p style={{fontSize:13,fontWeight:600,margin:'0 0 2px'}}>{item.name}</p>
                        <p style={{fontSize:12,color:'#9ca3af',margin:0}}>×{item.qty}</p>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 3 && <span style={{fontSize:13,color:'#9ca3af',alignSelf:'center'}}>+{order.items.length-3} more</span>}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,fontSize:17}}>৳{order.total?.toLocaleString()}</span>
                  <span style={{fontSize:13,color:'#9ca3af'}}>{order.paymentMethod?.toUpperCase()} · {order.paymentStatus}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'wishlist' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16}}>
          {wishlist?.length === 0 && <p style={{color:'#9ca3af',gridColumn:'1/-1',textAlign:'center',padding:40}}>Your wishlist is empty.</p>}
          {wishlist?.map(p=>(
            <div key={p._id} onClick={()=>navigate(`/product/${p.slug}`)} style={{cursor:'pointer',border:'1px solid #e5e7eb',borderRadius:10,overflow:'hidden'}}>
              {p.images?.[0] && <img src={p.images[0].url} alt={p.name} style={{width:'100%',aspectRatio:'1',objectFit:'cover'}}/>}
              <div style={{padding:'10px 12px'}}>
                <p style={{fontSize:14,fontWeight:600,margin:'0 0 4px'}}>{p.name}</p>
                <p style={{fontSize:15,fontWeight:700,margin:0}}>৳{(p.discountPrice||p.price)?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'profile' && (
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:24,maxWidth:480}}>
          <h3 style={{margin:'0 0 20px',fontSize:16}}>Update profile</h3>
          {[
            {k:'name', label:'Full name', type:'text'},
            {k:'phone',label:'Phone',     type:'tel'},
          ].map(f=>(
            <div key={f.k} style={{marginBottom:14}}>
              <label style={s.label}>{f.label}</label>
              <input type={f.type} value={editForm[f.k]} onChange={e=>setEditForm(fm=>({...fm,[f.k]:e.target.value}))}
                style={s.input} />
            </div>
          ))}
          <div style={{marginBottom:20}}>
            <label style={s.label}>Email</label>
            <input value={user.email} disabled style={{...s.input,background:'#f9fafb',color:'#9ca3af'}} />
          </div>
          <button onClick={()=>updateMutation.mutate(editForm)} disabled={updateMutation.isPending}
            style={{padding:'10px 24px',background:'#111827',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:600}}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  label: {display:'block',fontSize:13,fontWeight:600,marginBottom:6,color:'#374151'},
  input: {width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'inherit'},
};