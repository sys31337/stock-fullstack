import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PrivateRoute } from '@web/shared/components/Authentication';
import AppSection from '@web/shared/components/AppSection';
import './App.css';


const Authentication = React.lazy(() => import('@web/modules/Authentication'));
const Home = React.lazy(() => import('@web/modules/Home'));

/* Modules */
const Sale = React.lazy(() => import('@web/modules/Sale'));
const Order = React.lazy(() => import('@web/modules/Order'));
const Invoice = React.lazy(() => import('@web/modules/Invoice'));
const BillPdf = React.lazy(() => import('@web/modules/BillPdf'));
/* Modules */

const App = () => {
  useEffect(() => {
    const tt = 'qsd';
    console.log(localStorage.getItem('i18nextLng'));
  }, []);
  return (
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
)};

export default App;
