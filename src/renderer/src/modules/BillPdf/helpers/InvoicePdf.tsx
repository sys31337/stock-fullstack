import React from 'react';
import { View, Text, Document, Page, Font, StyleSheet } from '@react-pdf/renderer';
import { t } from 'i18next';
import dayjs from 'dayjs';
import { price, asLetters } from '@web/shared/functions/words';
import { defaultId } from '@web/config';
import { IProduct } from '@web/shared/types/product';
import { ICustomer } from '@web/shared/types/customer';

import RobotoCondensed from '@web/shared/components/PDF/fonts/RobotoCondensed-Regular.ttf';
import RobotoCondensedBold from '@web/shared/components/PDF/fonts/RobotoCondensed-Bold.ttf';
import RobotoCondensedLight from '@web/shared/components/PDF/fonts/RobotoCondensed-Light.ttf';
import RobotoCondensedItalic from '@web/shared/components/PDF/fonts/RobotoCondensed-Italic.ttf';
import RobotoCondensedBoldItalic from '@web/shared/components/PDF/fonts/RobotoCondensed-BoldItalic.ttf';
import RobotoCondensedLightItalic from '@web/shared/components/PDF/fonts/RobotoCondensed-LightItalic.ttf';

Font.register({
  family: 'RobotoCondensed',
  fonts: [
    { src: RobotoCondensed },
    { src: RobotoCondensedBold, fontWeight: 'bold' },
    { src: RobotoCondensedLight, fontWeight: 'light' },
    { src: RobotoCondensedItalic, fontStyle: 'italic' },
    { src: RobotoCondensedBoldItalic, fontWeight: 'bold', fontStyle: 'italic' },
    { src: RobotoCondensedLightItalic, fontWeight: 'light', fontStyle: 'italic' },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'RobotoCondensed', fontSize: 9 },
  companyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  companyLeft: { fontSize: 11, fontWeight: 'bold' },
  companyRight: { fontSize: 9, textAlign: 'right' },
  infoTable: { width: '100%', marginBottom: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLeft: { width: '70%', fontSize: 9 },
  infoRight: { width: '30%', fontSize: 9, textAlign: 'right' },
  infoRightBorder: { width: '30%', fontSize: 9, textAlign: 'right', borderTopWidth: 0.5, borderTopStyle: 'dashed', borderTopColor: '#000' },
  hr: { borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 10 },
  titleSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#000', marginBottom: 8 },
  titleLeft: { width: '41%' },
  invoiceTitle: { fontSize: 43, fontWeight: 'bold' },
  titleCenter: { width: '27%', alignItems: 'flex-end' },
  titleNum: { fontSize: 16, fontWeight: 'bold' },
  titleRight: { width: '31%', alignItems: 'flex-end' },
  titleDate: { fontSize: 16, fontWeight: 'bold' },
  clientTable: { width: '100%', marginBottom: 10 },
  clientRow: { flexDirection: 'row', marginBottom: 3 },
  clientLabel: { width: '21.1%', fontSize: 9, fontWeight: 'bold' },
  clientValue: { width: '28.9%', fontSize: 9 },
  clientLabelRight: { width: '21.1%', fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
  clientValueRight: { width: '28.9%', fontSize: 9, paddingLeft: 4 },
  clientTown: { width: '50%', fontSize: 9, fontWeight: 'bold' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 0.5, borderRightWidth: 0, borderBottomWidth: 0, marginBottom: 10 },
  tableHeadRow: { flexDirection: 'row', backgroundColor: '#d6dfe0' },
  tableRow: { flexDirection: 'row' },
  tableCol5: { width: '5%', borderStyle: 'solid', borderWidth: 0.5, borderLeftWidth: 0, borderTopWidth: 0, padding: 3 },
  tableCol20: { width: '20%', borderStyle: 'solid', borderWidth: 0.5, borderLeftWidth: 0, borderTopWidth: 0, padding: 3 },
  tableCol35: { width: '35%', borderStyle: 'solid', borderWidth: 0.5, borderLeftWidth: 0, borderTopWidth: 0, padding: 3 },
  tableCol10: { width: '10%', borderStyle: 'solid', borderWidth: 0.5, borderLeftWidth: 0, borderTopWidth: 0, padding: 3 },
  tableCol14: { width: '14%', borderStyle: 'solid', borderWidth: 0.5, borderLeftWidth: 0, borderTopWidth: 0, padding: 3 },
  tableCol15: { width: '15%', borderStyle: 'solid', borderWidth: 0.5, borderLeftWidth: 0, borderTopWidth: 0, padding: 3 },
  tableCell: { fontSize: 9, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { fontSize: 9, fontWeight: 'bold', textAlign: 'right' },
  totalValue: { fontSize: 9, textAlign: 'right' },
  footer: { marginTop: 20 },
  footerTotalsTable: { width: '100%' },
  footerTotalsRow: { flexDirection: 'row' },
  footerInvoiceStop: { width: '60%', fontSize: 9, paddingRight: 8 },
  footerAmountWords: { fontSize: 9, marginTop: 2 },
  footerTotalLabel: { width: '20%', fontSize: 9, fontWeight: 'bold', textAlign: 'right', paddingRight: 4, borderStyle: 'solid', borderWidth: 0.3, padding: 3 },
  footerTotalValue: { width: '20%', fontSize: 9, textAlign: 'right', borderStyle: 'solid', borderWidth: 0.3, padding: 3 },
  footerContactTable: { width: '100%', marginTop: 12 },
  footerContactRow: { flexDirection: 'row' },
  footerCompanyInfo: { width: '60%', fontSize: 9, paddingRight: 8 },
  footerCompanyName: { fontSize: 14, fontWeight: 'bold' },
  footerCompanyDetail: { fontSize: 9, marginTop: 4 },
  footerContactLabel: { width: '12%', fontSize: 9, fontWeight: 'bold', textAlign: 'right', paddingRight: 4, borderLeftWidth: 0.3, borderLeftColor: '#000', paddingVertical: 2 },
  footerContactValue: { width: '28%', fontSize: 9, paddingLeft: 4, paddingVertical: 2 },
});

const formatInvoiceNumber = (num: number, year: string) => {
  if (num < 10) return `0000${num}/${year}`;
  if (num < 100) return `000${num}/${year}`;
  if (num < 1000) return `00${num}/${year}`;
  if (num < 10000) return `0${num}/${year}`;
  return `${num}/${year}`;
};

interface InvoicePdfProps {
  data: {
    billDate: Date;
    orderId: number;
    products: IProduct[];
    orderTotalHT: number;
    orderTotalTTC: number;
    orderPaid: number;
    orderDebts: number;
    paymentMethod: string;
    description: string;
    customer: ICustomer;
  };
  settings: {
    companyName?: string;
    rc?: string;
    nif?: string;
    ai?: string;
    nis?: string;
    companyAddress?: string;
    companyPhone?: string;
    mobile?: string;
    website?: string;
    email?: string;
    wilaya?: string;
    accountNumber?: string;
    rib?: string;
    articleNumber?: string;
    stamp?: number;
    tva?: number;
  };
}

const InvoicePdf: React.FC<InvoicePdfProps> = ({ data, settings }) => {
  const { billDate, orderId, products, orderTotalHT, paymentMethod, customer, description, orderPaid } = data;
  const billYear = dayjs(billDate).format('YYYY');
  const billDayFormatted = dayjs(billDate).format('DD/MM/YYYY');
  const tvaRate = settings.tva ?? 19;
  const taxAmount = Number(orderTotalHT) * tvaRate / 100;
  const stampAmount = settings.stamp ?? 0;
  const totalTTC = Number(orderTotalHT) + taxAmount - Number(orderPaid || 0);
  const displayTTC = price(`${totalTTC}`);
  const grandTotalHT = price(`${orderTotalHT}`);
  const displayTax = price(`${taxAmount}`);
  const displayStamp = price(`${stampAmount}`);

  const cust = customer as ICustomer;
  const clientName = (cust && cust._id !== defaultId) ? cust?.fullname : 'Comptoir';
  const showTownCity = (cust?.town || cust?.city);

  return (
    <Document title={`${t('saleBillId')} ${orderId}`}>
      <Page size="A4" style={styles.page}>
        {/* Company header */}
        <View style={styles.companyRow}>
          <Text style={styles.companyLeft}>{settings.companyName || ''}</Text>
          <Text style={styles.companyRight}>{settings.companyAddress ? `${settings.companyAddress} - ${settings.wilaya || ''}` : settings.wilaya || ''}</Text>
        </View>

        {/* Company info: RC, Account/NIF, RIB/Article */}
        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft} />
            <Text style={styles.infoRight}>{t('rc')}: {settings.rc || ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLeft}>{t('account')}: {settings.accountNumber || ''}</Text>
            <Text style={styles.infoRightBorder}>{t('nif')}: {settings.nif || ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLeft}>{t('rib')}: {settings.rib || ''}</Text>
            <Text style={styles.infoRightBorder}>{t('article_number')}: {settings.articleNumber || ''}</Text>
          </View>
        </View>

        {/* HR */}
        <View style={styles.hr} />

        {/* Title section */}
        <View style={styles.titleSection}>
          <View style={styles.titleLeft}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
          </View>
          <View style={styles.titleCenter}>
            <Text style={styles.titleNum}>{t('number')}: {formatInvoiceNumber(orderId, billYear)}</Text>
          </View>
          <View style={styles.titleRight}>
            <Text style={styles.titleDate}>{settings.wilaya || ''} {t('the')} {billDayFormatted}</Text>
          </View>
        </View>

        {/* Spacing */}
        <View style={{ height: 8 }} />

        {/* Client info */}
        <View style={styles.clientTable}>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>{t('paymentmethod')}:</Text>
            <Text style={styles.clientValue}>{paymentMethod || ''}</Text>
            <Text style={styles.clientLabelRight}>{t('rc')}:</Text>
            <Text style={styles.clientValueRight}>{cust?.rc || ''}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>{t('must')}:</Text>
            <Text style={styles.clientValue}>{clientName}</Text>
            <Text style={styles.clientLabelRight}>{t('nif')}:</Text>
            <Text style={styles.clientValueRight}>{cust?.nif || ''}</Text>
          </View>
          <View style={styles.clientRow}>
            <View style={styles.clientTown}>
              {showTownCity ? (
                <Text>
                  {cust?.town ? cust.town.toUpperCase() : ''}
                  {cust?.town && cust?.city ? ' W ' : ''}
                  {cust?.city ? cust.city.toUpperCase() : ''}
                </Text>
              ) : null}
            </View>
            <Text style={styles.clientLabelRight}>{t('article_number')}:</Text>
            <Text style={styles.clientValueRight}>{cust?.nar || ''}</Text>
          </View>
        </View>

        {/* Spacing */}
        <View style={{ height: 6 }} />

        {/* Products table */}
        <View style={styles.table}>
          <View style={styles.tableHeadRow}>
            <View style={styles.tableCol5}><Text style={styles.tableCell}>#</Text></View>
            <View style={styles.tableCol20}><Text style={styles.tableCell}>{t('reference')}</Text></View>
            <View style={styles.tableCol35}><Text style={styles.tableCell}>{t('designation')}</Text></View>
            <View style={styles.tableCol10}><Text style={styles.tableCell}>{t('quantity')}</Text></View>
            <View style={styles.tableCol14}><Text style={styles.tableCell}>{t('price')} {t('unit')}</Text></View>
            <View style={styles.tableCol15}><Text style={styles.tableCell}>{t('total')}</Text></View>
          </View>
          {products.map((product, k) => (
            <View style={styles.tableRow} key={k}>
              <View style={styles.tableCol5}><Text style={styles.tableCell}>{k + 1}</Text></View>
              <View style={styles.tableCol20}><Text style={styles.tableCell}>{product.barCode}</Text></View>
              <View style={styles.tableCol35}><Text style={{ ...styles.tableCell, textAlign: 'left' }}>{product.productName}</Text></View>
              <View style={styles.tableCol10}><Text style={styles.tableCell}>{product.quantity}</Text></View>
              <View style={styles.tableCol14}><Text style={styles.tableCell}>{price(`${product.buyPrice}`)}</Text></View>
              <View style={styles.tableCol15}><Text style={{ ...styles.tableCell, textAlign: 'right' }}>{price(`${product.buyPrice * product.quantity * product.stack}`)}</Text></View>
            </View>
          ))}
        </View>

        {/* Reported amount */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <View style={{ width: '40%', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('reportedamount')}:  </Text>
            <Text style={{ fontSize: 9 }}>{grandTotalHT}</Text>
          </View>
        </View>

        {/* Footer section */}
        <View style={styles.footer}>
          {/* Totals table */}
          <View style={styles.footerTotalsTable}>
            <View style={styles.footerTotalsRow}>
              <View style={{ width: '60%', paddingRight: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('invoice_stop')}</Text>
                <Text style={styles.footerAmountWords}>{asLetters(totalTTC)} {t('tax_included')}.</Text>
              </View>
              <View style={{ width: '40%', flexDirection: 'row' }}>
                <View style={{ width: '50%', borderStyle: 'solid', borderWidth: 0.3, padding: 3, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('grandtotalht')}:</Text>
                </View>
                <View style={{ width: '50%', borderStyle: 'solid', borderWidth: 0.3, padding: 3, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9 }}>{grandTotalHT}</Text>
                </View>
              </View>
            </View>
            <View style={styles.footerTotalsRow}>
              <View style={{ width: '60%' }} />
              <View style={{ width: '40%', flexDirection: 'row' }}>
                <View style={{ width: '50%', borderStyle: 'solid', borderWidth: 0.3, borderTopWidth: 0, padding: 3, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('tva')}:</Text>
                </View>
                <View style={{ width: '50%', borderStyle: 'solid', borderWidth: 0.3, borderTopWidth: 0, padding: 3, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9 }}>{displayTax}</Text>
                </View>
              </View>
            </View>
            <View style={styles.footerTotalsRow}>
              <View style={{ width: '60%' }} />
              <View style={{ width: '40%', flexDirection: 'row' }}>
                <View style={{ width: '50%', borderStyle: 'solid', borderWidth: 0.3, borderTopWidth: 0, padding: 3, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('stamp')}:</Text>
                </View>
                <View style={{ width: '50%', borderStyle: 'solid', borderWidth: 0.3, borderTopWidth: 0, padding: 3, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9 }}>{displayStamp}</Text>
                </View>
              </View>
            </View>
            <View style={styles.footerTotalsRow}>
              <View style={{ width: '60%' }} />
              <View style={{ width: '40%', flexDirection: 'row' }}>
                <View style={{ width: '50%', borderStyle: 'solid', borderWidth: 0.3, borderTopWidth: 0, padding: 3, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('grandtotal')}:</Text>
                </View>
                <View style={{ width: '50%', borderStyle: 'solid', borderWidth: 0.3, borderTopWidth: 0, padding: 3, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 9 }}>{displayTTC}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Spacing */}
          <View style={{ height: 16 }} />

          {/* Company contact */}
          <View style={styles.footerContactTable}>
            <View style={styles.footerContactRow}>
              <View style={styles.footerCompanyInfo}>
                <Text style={styles.footerCompanyName}>{settings.companyName || ''}</Text>
                <Text style={styles.footerCompanyDetail}>{settings.companyAddress ? `${settings.companyAddress} - ${settings.wilaya || ''}` : settings.wilaya || ''}</Text>
              </View>
              <View style={{ width: '12%', borderTopWidth: 0.3, borderTopColor: '#000', borderLeftWidth: 0.3, borderLeftColor: '#000', paddingVertical: 2, alignItems: 'flex-end', paddingRight: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('phone')}:</Text>
              </View>
              <View style={{ width: '28%', borderTopWidth: 0.3, borderTopColor: '#000', paddingVertical: 2, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9 }}>{settings.companyPhone || ''}</Text>
              </View>
            </View>
            <View style={styles.footerContactRow}>
              <View style={styles.footerCompanyInfo} />
              <View style={{ width: '12%', borderLeftWidth: 0.3, borderLeftColor: '#000', paddingVertical: 2, alignItems: 'flex-end', paddingRight: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('mobile')}:</Text>
              </View>
              <View style={{ width: '28%', paddingVertical: 2, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9 }}>{settings.mobile || ''}</Text>
              </View>
            </View>
            <View style={styles.footerContactRow}>
              <View style={styles.footerCompanyInfo} />
              <View style={{ width: '12%', borderLeftWidth: 0.3, borderLeftColor: '#000', paddingVertical: 2, alignItems: 'flex-end', paddingRight: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('website')}:</Text>
              </View>
              <View style={{ width: '28%', paddingVertical: 2, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9 }}>{settings.website || ''}</Text>
              </View>
            </View>
            <View style={styles.footerContactRow}>
              <View style={styles.footerCompanyInfo} />
              <View style={{ width: '12%', borderLeftWidth: 0.3, borderLeftColor: '#000', paddingVertical: 2, alignItems: 'flex-end', paddingRight: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{t('email')}:</Text>
              </View>
              <View style={{ width: '28%', paddingVertical: 2, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9 }}>{settings.email || ''}</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {!!description && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 9 }}>{t('notes')}: {description}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePdf;
