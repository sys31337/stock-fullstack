import React from 'react';
import { Page, Document, PDFViewer } from '@react-pdf/renderer';
// import PropTypes from 'prop-types';

import styles from './styles';
import PageHeader from './Parts/Header';
import PageFooter from './Parts/Footer';

const PageLayout = ({ children }) => (
  <PDFViewer style={{ width: '100%', height: '100%' }}>
    <Document>
      <Page size="A4" style={styles.page}>
        <PageHeader />
        {children}
        <PageFooter />
      </Page>
    </Document>
  </PDFViewer>
);

// PageLayout.propTypes = {
//   children: PropTypes.oneOfType([
//     PropTypes.node,
//     PropTypes.arrayOf(PropTypes.node),
//   ]).isRequired,
// };

export default PageLayout;
