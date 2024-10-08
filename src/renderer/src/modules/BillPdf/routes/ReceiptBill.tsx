import React from 'react'
import { Box } from '@chakra-ui/react'
import ReceiptBillPdf from '@web/modules/BillPdf/helpers/ReceiptBillPdf'
import { useParams } from 'react-router-dom'
import { useGetBillInfo } from '@web/shared/hooks/useBill'
import Loading from '@web/shared/components/Loading'
import { PDFViewer } from '@react-pdf/renderer'

const ReceiptBill: React.FC = () => {
  const { id } = useParams();
  const { data, isFetching } = useGetBillInfo(id as string);
  if (isFetching) return <Loading />
  return (
    <Box h="100vh" w="100vw" m={0} p={0}>
      <PDFViewer width="100%" height="100%" style={{ margin: 0, padding: 0 }}>
        <ReceiptBillPdf data={data} />
      </PDFViewer>
    </Box>
  )
}

export default ReceiptBill
