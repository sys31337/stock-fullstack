import React from 'react';
import { Page, Document, PDFViewer } from '@react-pdf/renderer';

import styles from './styles';
// import PageHeader from './Parts/Header';
// import PageFooter from './Parts/Footer';

const PageLayout = ({ children }) => (
  <PDFViewer style={{ width: '100%', height: '100%' }}>
    <Document>
      <Page size="A4" style={styles.page}>
        {/* <PageHeader /> */}
        {children}
        {/* <PageFooter /> */}
      </Page>
    </Document>
  </PDFViewer>
);

export default PageLayout;
