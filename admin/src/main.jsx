import { StrictMode } from 'react';
import { createRoot }  from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { showLoader, hideLoader } from './components/GlobalLoader';
import ScrollRestoration from './components/ScrollRestoration';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                1,
      refetchOnWindowFocus: false,
      staleTime:            1000 * 30,
      onSettled:            hideLoader,
    },
    mutations: {
      onSettled:            hideLoader,
    },
  },
});

// Patch query cache to show loader on every query start
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action?.type === 'fetch') showLoader();
  if (event.type === 'updated' && ['success','error'].includes(event.action?.type)) hideLoader();
});
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.mutation?.state?.status === 'pending') showLoader();
  if (event.type === 'updated' && ['success','error'].includes(event.mutation?.state?.status)) hideLoader();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollRestoration />
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);