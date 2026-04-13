class ToastManager {
  _root = null;

  _getRoot() {
    if (this._root && document.body.contains(this._root)) return this._root;
    let el = document.getElementById('_toast_root_');
    if (!el) {
      el = Object.assign(document.createElement('div'), { id: '_toast_root_' });
      Object.assign(el.style, {
        position: 'fixed', top: '16px', right: '16px',
        zIndex: '2147483647', display: 'flex',
        flexDirection: 'column', gap: '8px',
        maxWidth: '380px', width: 'calc(100% - 32px)',
        pointerEvents: 'none',
      });
      document.body.appendChild(el);
      // inject keyframe once
      if (!document.getElementById('_toast_css_')) {
        const s = document.createElement('style');
        s.id = '_toast_css_';
        s.textContent = `
          @keyframes _tin  { from { transform:translateX(110%); opacity:0 } to { transform:translateX(0); opacity:1 } }
          @keyframes _tout { from { transform:translateX(0);    opacity:1 } to { transform:translateX(110%); opacity:0 } }
          @keyframes _spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        `;
        document.head.appendChild(s);
      }
    }
    this._root = el;
    return el;
  }

  _show(message, { type = 'info', duration = 4500 } = {}) {
    const root = this._getRoot();
    const id   = '_t_' + Math.random().toString(36).slice(2);

    const CFG = {
      success: { bg: '#059669', icon: '✓' },
      error:   { bg: '#dc2626', icon: '✕', dur: 7000 },
      warning: { bg: '#d97706', icon: '⚠' },
      info:    { bg: '#2563eb', icon: 'i' },
      loading: { bg: '#374151', icon: '↻', dur: 0 },
    };
    const cfg = CFG[type] || CFG.info;
    const dur = duration ?? cfg.dur ?? 4500;

    const el = document.createElement('div');
    el.id = id;
    Object.assign(el.style, {
      background: cfg.bg, color: '#fff',
      padding: '12px 14px', borderRadius: '10px',
      fontSize: '14px', fontWeight: '500',
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      pointerEvents: 'all', cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      animation: '_tin .3s cubic-bezier(.34,1.56,.64,1) forwards',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      lineHeight: '1.5', wordBreak: 'break-word',
    });

    const iconEl = document.createElement('span');
    iconEl.textContent = cfg.icon;
    Object.assign(iconEl.style, {
      flexShrink: '0', fontSize: '15px', fontWeight: '700',
      marginTop: '1px',
      ...(type === 'loading' && { animation: '_spin 1s linear infinite', display: 'inline-block' }),
    });

    const msgEl = document.createElement('span');
    msgEl.style.flex = '1';
    if (Array.isArray(message)) {
      msgEl.innerHTML = message.map(m => `<div style="margin-bottom:2px">${m}</div>`).join('');
    } else {
      msgEl.textContent = message;
    }

    const closeEl = document.createElement('button');
    closeEl.textContent = '×';
    Object.assign(closeEl.style, {
      background: 'none', border: 'none', color: '#fff',
      cursor: 'pointer', fontSize: '18px', lineHeight: '1',
      opacity: '.7', flexShrink: '0', padding: '0', marginTop: '-1px',
    });
    closeEl.onclick = (e) => { e.stopPropagation(); this._remove(id); };
    el.onclick = () => this._remove(id);

    el.appendChild(iconEl);
    el.appendChild(msgEl);
    el.appendChild(closeEl);
    root.appendChild(el);

    if (dur > 0) setTimeout(() => this._remove(id), dur);
    return id;
  }

  _remove(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = '_tout .25s ease forwards';
    setTimeout(() => el?.remove(), 270);
  }

  dismiss(id)        { if (id) this._remove(id); }
  success(msg, dur)  { return this._show(msg, { type: 'success', duration: dur }); }
  error(msg, dur)    { return this._show(msg, { type: 'error',   duration: dur }); }
  warning(msg, dur)  { return this._show(msg, { type: 'warning', duration: dur }); }
  info(msg, dur)     { return this._show(msg, { type: 'info',    duration: dur }); }
  loading(msg)       { return this._show(msg, { type: 'loading', duration: 0 }); }

  // Parse a BE error response and show a clear toast
  fromApiError(err) {
    const d = err?.response?.data;
    if (d?.errors?.length) {
      const lines = d.errors.map(e =>
        `• ${e.field ? e.field + ': ' : ''}${e.message.replace(/^"[^"]*"\s*/, '')}`
      );
      this.error([d.message || 'Validation failed', ...lines], 9000);
    } else {
      this.error(d?.message || err?.message || 'An error occurred');
    }
  }
}

export const toast = new ToastManager();