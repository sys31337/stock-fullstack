import React, { useEffect } from 'react';
import Shortcuts from 'shortcuts';
import { Route, Routes } from 'react-router-dom';
import { PrivateRoute } from '@web/shared/components/Authentication';
import AppSection from '@web/shared/components/AppSection';
import './App.css';

const shortcuts = new Shortcuts({
  capture: true, // Handle events during the capturing phase
  target: document, // Listening for events on the document object
  shouldHandleEvent(_event: unknown) {
    return true; // Handle all possible events
  }
});


const Authentication = React.lazy(() => import('@web/modules/Authentication'));
const Home = React.lazy(() => import('@web/modules/Home'));

/* Modules */
const BillPdf = React.lazy(() => import('@web/modules/BillPdf'));
/* Modules */

const App = () => {
  shortcuts.add([
    { shortcut: 'F1', handler: (e) => { console.log(e) } },
    { shortcut: 'F2', handler: (e) => { console.log(e) } },
    { shortcut: 'F3', handler: (e) => { console.log(e) } },
    { shortcut: 'F4', handler: (e) => { console.log(e) } },
    { shortcut: 'F5', handler: (e) => { console.log(e) } },
  ])
  useEffect(() => {
    shortcuts.start();
  }, []);

  return (
    <Routes>
      <Route path="connexion/*" element={<Authentication />} />
      <Route element={<AppSection />}>
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Routes>
                <Route path="*" element={<Home />} />
                <Route path="billpdf/*" element={<BillPdf />} />
              </Routes>
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  )
};

export default App;
