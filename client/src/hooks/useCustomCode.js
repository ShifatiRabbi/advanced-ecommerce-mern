import { useEffect } from 'react';
import { useQuery }  from '@tanstack/react-query';
import api from '../services/api';

export const useCustomCode = () => {
  const { data } = useQuery({
    queryKey: ['custom-code-public'],
    queryFn:  () => api.get('/settings/custom-code').then(r=>r.data.data),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!data) return;

    // Inject CSS
    let styleEl = document.getElementById('shopbd-custom-css');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'shopbd-custom-css'; document.head.appendChild(styleEl); }
    styleEl.textContent = data.customCss || '';

    // Inject JS
    if (data.customJs) {
      const existing = document.getElementById('shopbd-custom-js');
      if (existing) existing.remove();
      const scriptEl = document.createElement('script');
      scriptEl.id = 'shopbd-custom-js';
      scriptEl.textContent = data.customJs;
      document.body.appendChild(scriptEl);
    }

    // Inject header scripts
    if (data.headerScripts) {
      const existing = document.getElementById('shopbd-header-scripts');
      if (existing) existing.remove();
      const div = document.createElement('div');
      div.id = 'shopbd-header-scripts';
      div.innerHTML = data.headerScripts;
      document.head.appendChild(div);
    }
  }, [data]);
};