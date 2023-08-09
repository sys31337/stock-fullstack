import { StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFF',
    position: 'relative',
    padding: 20,
  },
  logo: { width: 150, height: 50 },
  greyBuilds: {
    position: 'absolute',
    right: -20,
    bottom: -5,
    width: 200,
    height: 250,
    zIndex: -1,
  },
  date: {
    fontSize: 12,
  },
  strong: {
    color: '#000',
  },
  visitBody: {
    marginTop: 50,
    paddingLeft: 20,
    flexGrow: 0.5,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  salerSection: {
    marginTop: 50,
    padding: 20,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  salerTitleTxt: {
    fontSize: 14,
    color: '#000',
  },
  salerNameTxt: {
    marginTop: 10,
    color: '#222',
    fontSize: 12,
  },
  visitInfoText: {
    marginBottom: 25,
    color: '#222',
    fontSize: 14,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docTitle: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
    width: '90%',
    lineHeight: 1.2,
    alignSelf: 'center',
    fontWeight: 'black',
  },
  paragraphCnt: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  paragraphTxt: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 1.5,
    color: '#333',
  },
  endParagraphTxt: {
    fontSize: 12.5,
    marginBottom: 5,
    lineHeight: 1.3,
    color: '#333',
  },
  variantTxt: {
    fontSize: 12,
    color: '#000',
  },
  locationName: {
    textDecoration: 'underline',
    fontSize: 12,
    marginBottom: 5,
    color: '#111',
  },
  tasksInLocationCnt: {
    paddingLeft: 10,
  },
  signaturesSection: {
    marginTop: 30,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  authorType: {
    textDecoration: 'underline',
    fontSize: 11,
    marginBottom: 10,
  },
  signatureSecTxt: {
    fontSize: 10,
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    zIndex: -1,
  },
  siteUrlContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flexGrow: 1,
    height: 1,
    borderTopWidth: 0.5,
    borderTopColor: '#555',
  },
  siteUrl: {
    color: '#c40d1e',
    paddingHorizontal: 5,
    marginTop: -2.5,
  },
  contactInfoWrapper: {
    paddingHorizontal: 5,
    marginTop: 5,
  },
  contactInfoTxt: {
    fontSize: 10,
    lineHeight: 1.3,
    textAlign: 'center',
    color: '#666',
  },
  emailContactTxt: {
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },
  redTxt: {
    color: '#c40d1e',
  },
  title: {
    fontSize: 22,
    marginVertical: 20,
    alignSelf: 'center',
  },
  secondaryTitle: {
    fontSize: 15,
    marginVertical: 10,
  },
  smallText: {
    fontSize: 12,
    marginBottom: 5,
    color: '#444',
  },
});

export default styles;
