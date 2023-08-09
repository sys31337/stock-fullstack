import { StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableHead: {
    margin: "auto",
    flexDirection: "row",
    backgroundColor: '#ccc'
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCell: {
    margin: "auto",
    paddingVertical: 5,
    fontSize: 10
  }
});

export default styles;
