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
    <Box h={'100vh'}>
      <PDFViewer style={{width: '100vw', height: '100%'}}>
        <ReceiptBillPdf data={data} />
      </PDFViewer>
    </Box>
  )
}

export default ReceiptBill