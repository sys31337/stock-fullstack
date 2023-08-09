import React from 'react';
import { View, Image, Text } from '@react-pdf/renderer';
import { format } from 'date-fns';

import styles from '../styles';

const PageHeader = () => (
  <View style={styles.pageHeader}>
    <View>
      <Image src="/img/logo_bpi.png" style={styles.logo} />
    </View>
    <View>
      <Text style={styles.paragraphTxt}>{`Fait le ${format(new Date(), 'dd/MM/yyyy')}`}</Text>
    </View>
  </View>
);
export default PageHeader;
