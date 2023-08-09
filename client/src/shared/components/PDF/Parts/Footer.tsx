import React from 'react';
import { Text, View, Image } from '@react-pdf/renderer';
import styles from '../styles';

const Footer = () => (
  <View style={styles.footer}>
    <Image src="/img/gray_buildings.png" style={styles.greyBuilds} />
    <View>
      <View style={styles.siteUrlContainer}>
        <View style={styles.line} />
        <Text style={styles.siteUrl}>www.bessapromotion.com</Text>
        <View style={styles.line} />
      </View>
      <View style={styles.contactInfoWrapper}>
        <Text style={styles.contactInfoTxt}>Siège social: 178 lot Boushaki, Bab Ezzouar, Alger,  Tél: +213 23 28 38 63 / 64 / 65  Fax: +213 23 28 38 68 </Text>
        <Text style={styles.contactInfoTxt}>
          Mob: +213 560 01
          <Text style={styles.redTxt}> 53 53 </Text>
          / +213 560 01
          <Text style={styles.redTxt}> 57 57 </Text>
          / +213 560 01
          <Text style={styles.redTxt}> 59 59 </Text>
          / +213 560 01
          <Text style={styles.redTxt}> 64 64 </Text>
          / +213 560 01
          <Text style={styles.redTxt}> 68 68 </Text>
          / +213 560 01
          <Text style={styles.redTxt}> 69 69 </Text>
        </Text>
        <Text style={styles.emailContactTxt}>
          <Text style={styles.redTxt}> contact </Text>
          @bessapromotion.com
        </Text>
      </View>
    </View>
  </View>

);
export default Footer;
