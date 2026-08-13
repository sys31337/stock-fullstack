import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const ReportsHub = React.lazy(() => import('@web/modules/Reports/components/ReportsHub'));
const LedgerPage = React.lazy(() => import('@web/modules/Reports/components/LedgerPage'));
const CashStatementPage = React.lazy(() => import('@web/modules/Reports/components/CashStatementPage'));
const ProductStatsPage = React.lazy(() => import('@web/modules/Reports/components/ProductStatsPage'));
const SalespeoplePage = React.lazy(() => import('@web/modules/Reports/components/SalespeoplePage'));
const DeliveryReturnsPage = React.lazy(() => import('@web/modules/Reports/components/DeliveryReturnsPage'));

const Reports = () => (
  <Routes>
    <Route index element={<ReportsHub />} />
    <Route path="ledger" element={<LedgerPage />} />
    <Route path="cash-statement" element={<CashStatementPage />} />
    <Route path="products" element={<ProductStatsPage />} />
    <Route path="salespeople" element={<SalespeoplePage />} />
    <Route path="delivery-returns" element={<DeliveryReturnsPage />} />
    <Route path="*" element={<Navigate to="/reports" replace />} />
  </Routes>
);

export default Reports;
