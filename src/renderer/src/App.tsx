import React from 'react';
import Shortcuts from 'shortcuts';
import { Route, Routes, Navigate } from 'react-router-dom';
import { PrivateRoute } from '@web/shared/components/Authentication';
import AppSection from '@web/shared/components/AppSection';
import CustomTitleBar from '@web/shared/components/CustomTitleBar';
import { ToastProvider, ToastStateProvider } from '@web/shared/components/ui/use-toast';
import './App.css';

const shortcuts = new Shortcuts({
  capture: true,
  target: document,
  shouldHandleEvent(_event: unknown) {
    return true;
  }
});

const Authentication = React.lazy(() => import('@web/modules/Authentication'));
const Home = React.lazy(() => import('@web/modules/Home'));
const BillPdf = React.lazy(() => import('@web/modules/BillPdf'));
const Connection = React.lazy(() => import('@web/modules/Connection'));

const App = () => {
  React.useEffect(() => {
    shortcuts.start();
  }, []);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden">
      <div className="app-frame h-full flex flex-col">
        <CustomTitleBar />
        <div className="flex-1 overflow-hidden flex flex-col">
          <Routes>
            <Route path="connexion/*" element={<ToastProvider><ToastStateProvider><Authentication /></ToastStateProvider></ToastProvider>} />
            <Route element={<AppSection />}>
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="billpdf/*" element={<BillPdf />} />
                      <Route path="connection" element={<Connection />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
        </div>
      </div>
    </div>
  )
};

export default App;
