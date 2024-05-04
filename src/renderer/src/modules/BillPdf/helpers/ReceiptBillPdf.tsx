import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import styles from '@web/shared/components/PDF/styles';
import { t } from 'i18next';
import dayjs from 'dayjs';
import { price } from '@web/shared/functions/words';
import { defaultId } from '@web/config';

const ReceiptBillPdf: React.FC<{ data: any }> = ({ data }) => {

  const { billDate,
    orderId,
    type,
    products,
    orderTotalHT,
    orderTotalTTC,
    orderPaid,
    orderDebts,
    paymentMethod,
    description,
    customer,
  } = data;
  return (
    <View style={{ padding: 20 }}>
      <View style={styles.billHeader}>
        <View style={styles.billInfo}>
          <View style={styles.Elements}>
            <Text style={{ fontWeight: 'bold' }}>{t('customer')}:</Text>
            <Text>{(customer && customer._id !== defaultId) ? customer?.fullname : t('counter')}</Text>
          </View>
          <View style={styles.Elements}>
            <Text style={{ fontWeight: 'bold' }}>{t('date')}:</Text>
            <Text>{dayjs(billDate).format('DD/MM/YYYY HH:mm:ss')}</Text>
          </View>
        </View>
        <View style={styles.billTitle}>
          {type === 'BUY' && (<Text>{t('receiptBillId')}{orderId}</Text>)}
          {type === 'SALE' && (<Text>{t('saleBillId')}{orderId}</Text>)}
          {type === 'ORDER' && (<Text>{t('orderId')}{orderId}</Text>)}
        </View>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHead}>
          <View style={{ ...styles.tableCol, width: '5%' }}>
            <Text style={styles.tableCell}>#</Text>
          </View>
          <View style={{ ...styles.tableCol, width: '15%' }}>
            <Text style={styles.tableCell}>{t('reference')}</Text>
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
                <Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>{price(`${buyPrice}`)}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '12.5%' }}>
                <Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>{price(`${productTotal}`)}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '12.5%' }}>
                <Text style={{ ...styles.tableCell, fontWeight: 'bold' }}>{price(`${productTotal + productTva}`)}</Text>
              </View>
            </View>
          )
        })}
      </View>
      <View style={styles.billFooter}>
        <View>
          {!!description && (<Text>Note: {description}</Text>)}
        </View>

        <View style={styles.orderPaymentInfo}>
          <View style={styles.Elements}>
            <Text style={styles.ElementKey}>Totale (HT):</Text>
            <Text style={styles.ElementValue}>{price(orderTotalHT)} DA</Text>
          </View>
          <View style={styles.Elements}>
            <Text style={styles.ElementKey}>Totale (TTC):</Text>
            <Text style={styles.ElementValue}>{price(orderTotalTTC)} DA</Text>
          </View>
          <View style={styles.Elements}>
            <Text style={styles.ElementKey}>Versement:</Text>
            <Text style={styles.ElementValue}>{price(orderPaid)} DA</Text>
          </View>
          <View style={styles.Elements}>
            <Text style={styles.ElementKey}>Dettes:</Text>
            <Text style={styles.ElementValue}>{price(orderDebts)} DA</Text>
          </View>
          <View style={styles.Elements}>
            <Text style={styles.ElementKey}>Méthode de paiement:</Text>
            <Text style={styles.ElementValue}>{paymentMethod}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ReceiptBillPdf;
