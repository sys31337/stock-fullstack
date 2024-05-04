import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const ReceiptBill = React.lazy(() => import('@web/modules/BillPdf/routes/ReceiptBill'));

const BillPdf = () => (
  <Routes>
    <Route path="/:id" element={<ReceiptBill />} />
    <Route path="/*" element={<Navigate to='/' />} />
  </Routes>
);

export default BillPdf;
