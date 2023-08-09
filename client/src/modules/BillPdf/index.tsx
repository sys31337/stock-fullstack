import React, { useState, useEffect } from 'react';

import ReceiptBill from './helpers/ReceiptBill';
import Loading from '@shared/components/Loading';
import PageLayout from '@shared/components/PDF/Layout';
import { Box } from '@chakra-ui/react';

const BillPdf = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false)
  }, []);

  if (loading) return <Loading />;

  return loading ? <Loading /> : (
    <Box h={'100vh'}>
      <PageLayout>
        <ReceiptBill />
      </PageLayout>
    </Box>
  );
};

export default BillPdf;
