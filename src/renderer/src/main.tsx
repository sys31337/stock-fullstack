import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
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
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>
    </Suspense>

    <meta name="solustock-ui" content={''} />
  </>,
);
