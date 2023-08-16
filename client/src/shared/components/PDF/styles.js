import { StyleSheet } from "@react-pdf/renderer";

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
    backgroundColor: "#ddd",
    fontWeight: 'bold'
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
  },
  billFooter: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    fontSize: 10
  },
  orderPaymentInfo: {
    fontSize: 10,
    textAlign: "left",
    alignItems: "flex-end"
  },
  billHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12
  },
  billInfo: {},
  billTitle: {
    backgroundColor: '#ddd',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 5,
    fontSize: 16,
    fontWeight: 'bold'
  },
  Elements: {
    display: 'flex',
    flexDirection: 'row',
    gap: 2,
  },
  ElementKey: {
    fontWeight: 'bold',
  },
  ElementValue: {
    textAlign: 'right',
    width: '70px'
  }
});

export default styles;
