import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PrivateRoute } from '@shared/components/Authentication';
import AppSection from '@shared/components/AppSection';
import './App.css';


const Authentication = React.lazy(() => import('@modules/Authentication'));
const Home = React.lazy(() => import('@modules/Home'));

/* Modules */
const Sale = React.lazy(() => import('@modules/Sale'));
const Order = React.lazy(() => import('@modules/Order'));
const Invoice = React.lazy(() => import('@modules/Invoice'));
const BillPdf = React.lazy(() => import('@modules/BillPdf'));
/* Modules */

const App = () => (
  <Routes>
    <Route path="connexion/*" element={<Authentication />} />
    <Route path="billpdf/*" element={<BillPdf />} />
    <Route element={<AppSection />}>
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Routes>
              <Route path="*" element={<Home />} />
              <Route path="sale" element={<Sale />} />
              <Route path="order" element={<Order />} />
              <Route path="invoice" element={<Invoice />} />
            </Routes>
          </PrivateRoute>
        }
      />
    </Route>
  </Routes>
);

export default App;
