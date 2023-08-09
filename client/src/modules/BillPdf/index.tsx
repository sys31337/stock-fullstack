import React, { useState, useEffect, useCallback } from 'react';
import { Text } from '@react-pdf/renderer';
import SalerSection from './helpers/SalerSection';

import VisitInfo from './helpers/VisitInfo';
import Loading from '@shared/components/Loading';
import PageLayout from '@shared/components/PDF/Layout';
import styles from '@shared/components/PDF/styles';
import SubNav from '@shared/components/SubNav';

const VisitVoucher = () => {
  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState(0);
  const getVisit = useCallback(() => {
    setVisit(1)
    setLoading(false)
  }, []);

  useEffect(() => {
    getVisit();
  }, [getVisit]);

  if (loading) return <Loading />;

  const salerName = 'test';

  return loading ? <Loading /> : (
    <>
      <SubNav />
      <PageLayout>
        <Text style={[styles.docTitle, { marginTop: 90, fontSize: 18, textDecoration: 'underline' }]}>Bon de visite</Text>
        <VisitInfo visit={visit} />
        <SalerSection salerName={salerName} />
      </PageLayout>
    </>
  );
};

export default VisitVoucher;
