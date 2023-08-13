import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import styles from '@shared/components/PDF/styles';

const ReceiptBillPdf = ({ id, data }) => {

  console.log(data);
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ textAlign: 'center' }}>Bill: {id}</Text>
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
