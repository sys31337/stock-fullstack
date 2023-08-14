import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import styles from '@shared/components/PDF/styles';
import { t } from 'i18next';
import dayjs from 'dayjs';

const ReceiptBillPdf = ({ data }) => {

  const { billDate,
    orderId,
    // type,
    // orderTotalHT,
    // orderTotalTTC,
    // orderPaid,
    // orderDebts,
    // paymentMethod,
    // description
  } = data;
  return (
    <View style={{ padding: 20 }}>
      <View style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: '#ddd',
          padding: 10,
          paddingHorizontal: 20,
          borderRadius: 10,
          marginBottom: 5,
          fontSize: 12
        }}>
          <Text>{t('receiptBillId')} {orderId}</Text>
          <Text>{t('date')} {dayjs(billDate).format('DD/MM/YYYY HH:mm:ss')}</Text>
        </View>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHead}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Product</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Type</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Period</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Price</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>React-PDF</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>3 User </Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>2019-02-20 - 2020-02-19</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>5€</Text>
          </View>
        </View>
      </View>
      <Text>
        {JSON.stringify(data)}
      </Text>
    </View>
  );
};

export default ReceiptBillPdf;
