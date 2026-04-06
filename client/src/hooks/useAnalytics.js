import { useEffect } from 'react';
import { useQuery }  from '@tanstack/react-query';
import api from '../services/api';

export const useAnalytics = () => {
  const { data: settings } = useQuery({
    queryKey: ['marketing-settings-public'],
    queryFn:  () => api.get('/seo/settings').then(r => r.data.data),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (!settings) return;

    if (settings.ga4MeasurementId && !window._ga4Loaded) {
      window._ga4Loaded = true;
      const s = document.createElement('script');
      s.src = `https://www.googletagmanager.com/gtag/js?id=${settings.ga4MeasurementId}`;
      s.async = true;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', settings.ga4MeasurementId);
    }

    if (settings.gtmId && !window._gtmLoaded) {
      window._gtmLoaded = true;
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer',settings.gtmId);
    }

    if (settings.fbPixelId && !window._fbLoaded) {
      window._fbLoaded = true;
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', settings.fbPixelId);
      window.fbq('track', 'PageView');
    }
  }, [settings]);
};

export const trackPurchase = (order) => {
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: order.orderNumber,
      value:          order.total,
      currency:       'BDT',
      items:          order.items?.map(i => ({ item_name: i.name, price: i.price, quantity: i.qty })),
    });
  }
  if (window.fbq) {
    window.fbq('track', 'Purchase', { value: order.total, currency: 'BDT', order_id: order.orderNumber });
  }
};

export const trackAddToCart = (product, qty) => {
  if (window.gtag) window.gtag('event', 'add_to_cart', { items: [{ item_name: product.name, price: product.discountPrice || product.price, quantity: qty }] });
  if (window.fbq) window.fbq('track', 'AddToCart', { content_name: product.name, value: product.discountPrice || product.price, currency: 'BDT' });
};