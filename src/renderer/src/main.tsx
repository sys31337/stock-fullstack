import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { config } from '@web/config';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@web/shared/services/queryClient';
import Loading from '@web/shared/components/Loading';
import '@fontsource/roboto';
import './App.css';
import App from './App';
import './i18n';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <>
    <Suspense fallback={<Loading />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={config.appBaseUrl}>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Suspense>

    <meta name="solustock-ui" content={''} />
  </>,
);
