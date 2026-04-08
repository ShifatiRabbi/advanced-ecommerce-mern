// Lightweight toast system — no dependencies
class ToastManager {
  constructor() {
    this.container = null;
    this.queue     = [];
    this._ensureContainer();
  }

  _ensureContainer() {
    if (typeof window === 'undefined') return;
    if (document.getElementById('toast-root')) {
      this.container = document.getElementById('toast-root');
      return;
    }
    const el = document.createElement('div');
    el.id = 'toast-root';
    el.style.cssText = [
      'position:fixed', 'top:20px', 'right:20px', 'z-index:99999',
      'display:flex', 'flex-direction:column', 'gap:10px',
      'pointer-events:none', 'max-width:380px', 'width:100%',
    ].join(';');
    document.body.appendChild(el);
    this.container = el;
  }

  show(message, type = 'info', duration = 4000) {
    this._ensureContainer();
    if (!this.container) return;

    const CONFIGS = {
      success: { bg: '#059669', border: '#065f46', icon: '✓' },
      error:   { bg: '#dc2626', border: '#991b1b', icon: '✕' },
      warning: { bg: '#d97706', border: '#92400e', icon: '⚠' },
      info:    { bg: '#2563eb', border: '#1e40af', icon: 'ℹ' },
      loading: { bg: '#374151', border: '#111827', icon: '⟳' },
    };
    const cfg = CONFIGS[type] || CONFIGS.info;

    const id   = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const el   = document.createElement('div');
    el.id      = id;
    el.style.cssText = [
      `background:${cfg.bg}`,
      `border:1px solid ${cfg.border}`,
      'color:#fff',
      'padding:12px 16px',
      'border-radius:10px',
      'font-size:14px',
      'font-weight:500',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'pointer-events:all',
      'cursor:pointer',
      'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
      'transform:translateX(120%)',
      'transition:transform .3s cubic-bezier(.34,1.56,.64,1)',
      'font-family:system-ui,sans-serif',
      'line-height:1.4',
    ].join(';');

    const iconEl  = document.createElement('span');
    iconEl.style.cssText = `font-size:16px;flex-shrink:0;${type === 'loading' ? 'animation:spin 1s linear infinite' : ''}`;
    iconEl.textContent   = cfg.icon;

    const textEl  = document.createElement('span');
    textEl.style.cssText = 'flex:1';

    // Support array of errors (BE validation)
    if (Array.isArray(message)) {
      textEl.innerHTML = message.map(m => `<div>${m}</div>`).join('');
    } else {
      textEl.textContent = message;
    }

    const closeEl = document.createElement('button');
    closeEl.style.cssText = 'background:none;border:none;color:#fff;cursor:pointer;font-size:16px;opacity:.7;padding:0;margin-left:4px;flex-shrink:0';
    closeEl.textContent   = '×';
    closeEl.onclick       = (e) => { e.stopPropagation(); this._remove(id); };

    el.appendChild(iconEl);
    el.appendChild(textEl);
    el.appendChild(closeEl);
    el.onclick = () => this._remove(id);
    this.container.appendChild(el);

    // Inject spin keyframe once
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id    = 'toast-styles';
      style.textContent = '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => { el.style.transform = 'translateX(0)'; });
    });

    if (duration > 0 && type !== 'loading') {
      setTimeout(() => this._remove(id), duration);
    }

    return id;
  }

  _remove(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transform = 'translateX(120%)';
    el.style.opacity   = '0';
    setTimeout(() => el?.remove(), 320);
  }

  dismiss(id) { if (id) this._remove(id); }

  success(msg, dur)  { return this.show(msg, 'success', dur); }
  error(msg, dur)    { return this.show(msg, 'error',   dur || 6000); }
  warning(msg, dur)  { return this.show(msg, 'warning', dur); }
  info(msg, dur)     { return this.show(msg, 'info',    dur); }
  loading(msg)       { return this.show(msg, 'loading', 0); }

  // Parse BE error response and show formatted toast
  fromApiError(err) {
    const data = err?.response?.data;
    if (data?.errors?.length) {
      const msgs = data.errors.map(e => `• ${e.field}: ${e.message.replace(/^"[^"]*"\s*/, '')}`);
      this.error(['Validation failed:', ...msgs], 8000);
    } else {
      this.error(data?.message || err?.message || 'Something went wrong');
    }
  }
}

export const toast = new ToastManager();