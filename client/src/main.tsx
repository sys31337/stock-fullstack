import React, { Suspense } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { config } from '@config';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@shared/services/queryClient';
import '../i18n';
import theme from '@config/theme';
import Loading from '@shared/components/Loading';
import Normalize from 'react-normalize';
import App from './App';
import '@fontsource/roboto';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Suspense fallback={<Loading />}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={config.appBaseUrl}>
            <Normalize />
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </Suspense>
    </ChakraProvider>

    <meta name="solustock-ui" content={''} />
  </React.StrictMode>,
);
