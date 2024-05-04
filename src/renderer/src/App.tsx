import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PrivateRoute } from '@web/shared/components/Authentication';
import AppSection from '@web/shared/components/AppSection';
import './App.css';


const Authentication = React.lazy(() => import('@web/modules/Authentication'));
const Home = React.lazy(() => import('@web/modules/Home'));

/* Modules */
const BillPdf = React.lazy(() => import('@web/modules/BillPdf'));
/* Modules */

const App = () => (
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
);

export default App;
