import React from 'react';
// import PropTypes from 'prop-types';
import { View, Text } from '@react-pdf/renderer';
import { format } from 'date-fns';
import styles from '@shared/components/PDF/styles';

const VisitInfo = () => {

  const visitDate = new Date();

  return (
    <View style={styles.visitBody}>
      <Text style={styles.visitInfoText}>
        Projet :
        <Text style={styles.strong}>test</Text>
      </Text>
      <Text style={styles.visitInfoText}>
        Nom et prénom du visiteur :
        <Text style={styles.strong}>test2</Text>
      </Text>
      <Text style={styles.visitInfoText}>
        Date de la visite :
        <Text style={styles.strong}>{format(new Date(visitDate), 'dd/MM/yyyy à HH:mm zz')}</Text>
      </Text>
      <View>
        <Text style={{ ...styles.visitInfoText, marginBottom: 10 }}>Appartement(s) a visiter :</Text>
        <View style={{ marginLeft: 14 }}>
          {[1, 2, 3].map((appartment, k) => (
            <Text style={{ ...styles.visitInfoText, marginVertical: 5, fontSize: 12 }} key={k}>
              {`- Bloc: 1, étage: 1, 2, 3`}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

// VisitInfo.propTypes = {
//   visit: PropTypes.shape({
//     residenceId: PropTypes.shape({
//       name: PropTypes.string.isRequired,
//     }).isRequired,
//     postponed_date: PropTypes.string,
//     date: PropTypes.string,
//     guestName: PropTypes.string,
//     customerName: PropTypes.string,
//     appartmentId: PropTypes.arrayOf(PropTypes.shape({
//       blocId: PropTypes.shape({
//         name: PropTypes.string.isRequired,
//       }).isRequired,
//       floor: PropTypes.string.isRequired,
//       type: PropTypes.string.isRequired,
//       location: PropTypes.string.isRequired,
//     }).isRequired).isRequired,
//   }).isRequired,
// };

export default VisitInfo;
