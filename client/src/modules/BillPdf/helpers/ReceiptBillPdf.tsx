import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import styles from '@shared/components/PDF/styles';
import { t } from 'i18next';
import dayjs from 'dayjs';
import { price } from '@shared/functions/words';

const ReceiptBillPdf = ({ data }) => {

  const { billDate,
    orderId,
    type,
    products,
    orderTotalHT,
    orderTotalTTC,
    orderPaid,
    orderDebts,
    paymentMethod,
    description
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
          {type === 'BUY' && (<Text>{t('receiptBillId')} {orderId}</Text>)}
          {type === 'SALE' && (<Text>{t('saleBillId')} {orderId}</Text>)}
          {type === 'ORDER' && (<Text>{t('orderId')} {orderId}</Text>)}
          <Text>{t('date')} {dayjs(billDate).format('DD/MM/YYYY HH:mm:ss')}</Text>
        </View>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHead}>
          <View style={{ ...styles.tableCol, width: '5%' }}>
            <Text style={styles.tableCell}>#</Text>
          </View>
          <View style={{ ...styles.tableCol, width: '15%' }}>
            <Text style={styles.tableCell}>Ref</Text>
          </View>
          <View style={{ ...styles.tableCol, width: '35%' }}>
            <Text style={styles.tableCell}>Désignation</Text>
          </View>
          <View style={{ ...styles.tableCol, width: '10%' }}>
            <Text style={styles.tableCell}>Quantité</Text>
          </View>
          <View style={{ ...styles.tableCol, width: '10%' }}>
            <Text style={styles.tableCell}>Prix</Text>
          </View>
          <View style={{ ...styles.tableCol, width: '12.5%' }}>
            <Text style={styles.tableCell}>Total (HT)</Text>
          </View>
          <View style={{ ...styles.tableCol, width: '12.5%' }}>
            <Text style={styles.tableCell}>Total (TTC)</Text>
          </View>
        </View>
        {products.map(({ barCode, productName, quantity, stack, buyPrice, tva }, k) => {
          const productTotal = buyPrice * quantity * stack;
          const productTva = buyPrice * quantity * stack * tva / 100;
          return (
            <View style={styles.tableRow} key={k}>
              <View style={{ ...styles.tableCol, width: '5%' }}>
                <Text style={styles.tableCell}>{k + 1}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '15%' }}>
                <Text style={styles.tableCell}>{barCode}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '35%' }}>
                <Text style={styles.tableCell}>{productName}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '10%' }}>
                <Text style={styles.tableCell}>{`${quantity} × ${stack}`}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '10%' }}>
                <Text style={styles.tableCell}>{price(`${buyPrice}`)}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '12.5%' }}>
                <Text style={styles.tableCell}>{price(`${productTotal}`)}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '12.5%' }}>
                <Text style={styles.tableCell}>{price(`${productTotal + productTva}`)}</Text>
              </View>
            </View>
          )
        })}
      </View>
      <View style={styles.billFooter}>
        <View>
          {description && (<Text>Note: {description}</Text>)}
        </View>

        <View style={styles.orderPaymentInfo}>
          <Text>Totale (HT):  {price(orderTotalHT)} DA</Text>
          <Text>Totale (TTC):  {price(orderTotalTTC)} DA</Text>
          <Text>Montant payé:  {price(orderPaid)} DA</Text>
          <Text>Dettes:  {price(orderDebts)} DA</Text>
          <Text>Méthode de paiement:  {paymentMethod}</Text>
        </View>
      </View>
    </View>
  );
};

export default ReceiptBillPdf;
