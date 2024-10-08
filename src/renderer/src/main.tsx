import { Suspense } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { config } from '@web/config';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@web/shared/services/queryClient';
import theme from '@web/config/theme';
import Loading from '@web/shared/components/Loading';
import '@fontsource/roboto';
import App from './App';
import './i18n';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <>
    <ChakraProvider theme={theme}>
      <Suspense fallback={<Loading />}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={config.appBaseUrl}>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </Suspense>
    </ChakraProvider>

    <meta name="solustock-ui" content={''} />
  </>,
);
