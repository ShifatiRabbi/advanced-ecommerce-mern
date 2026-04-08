import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import './i18n/index.js';
import App from './App.jsx';
import { showLoader, hideLoader } from './components/GlobalLoader';
import ScrollRestoration from './components/ScrollRestoration';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      // Show loader on every query fetch
      onSettled: hideLoader,
    },
    mutations: {
      onSettled: hideLoader,
    },
  },
});

// 2. Patch query cache to show loader on every query start
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action?.type === 'fetch') {
    showLoader();
  }
  if (event.type === 'updated' && ['success', 'error'].includes(event.action?.type)) {
    hideLoader();
  }
});

// 3. Patch mutation cache to show loader on every mutation start
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.mutation?.state?.status === 'pending') {
    showLoader();
  }
  if (event.type === 'updated' && ['success', 'error'].includes(event.mutation?.state?.status)) {
    hideLoader();
  }
});

// 4. Render the App
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollRestoration />
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);