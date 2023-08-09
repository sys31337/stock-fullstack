import React from 'react';
import PropTypes from 'prop-types';
import { Text, View } from '@react-pdf/renderer';
import styles from '@shared/components/PDF/styles';

const SalerSection = ({ salerName }) => (
  <View style={styles.salerSection}>
    <Text style={styles.salerTitleTxt}>COMMERCIALE : </Text>
    <Text style={styles.salerNameTxt}>{salerName}</Text>
  </View>
);

SalerSection.propTypes = {
  salerName: PropTypes.string.isRequired,
};

export default SalerSection;
