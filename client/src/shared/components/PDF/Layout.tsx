import React from 'react';
import { Page, Document, PDFViewer, Font } from '@react-pdf/renderer';

import styles from './styles';

import RobotoCondensed from './fonts/RobotoCondensed-Regular.ttf'
import RobotoCondensedBold from './fonts/RobotoCondensed-Bold.ttf'
import RobotoCondensedLight from './fonts/RobotoCondensed-Light.ttf'
import RobotoCondensedItalic from './fonts/RobotoCondensed-Italic.ttf'
import RobotoCondensedBoldItalic from './fonts/RobotoCondensed-BoldItalic.ttf'
import RobotoCondensedLightItalic from './fonts/RobotoCondensed-LightItalic.ttf'

Font.register({
  family: 'RobotoCondensed',
  fonts: [
    { src: RobotoCondensed },
    { src: RobotoCondensedBold, fontWeight: 'bold' },
    { src: RobotoCondensedLight, fontWeight: 'light' },
    { src: RobotoCondensedItalic, fontWeight: 'normal', fontStyle: 'italic' },
    { src: RobotoCondensedBoldItalic, fontWeight: 'bold', fontStyle: 'italic' },
    { src: RobotoCondensedLightItalic, fontWeight: 'light', fontStyle: 'italic' },
  ],
});


const PageLayout = ({ children }) => (
  <PDFViewer style={{ width: '100%', height: '100%', }}>
    <Document>
      <Page size="A4" style={{ ...styles.page, fontFamily: 'RobotoCondensed', }}>
        {children}
      </Page>
    </Document>
  </PDFViewer>
);

export default PageLayout;
