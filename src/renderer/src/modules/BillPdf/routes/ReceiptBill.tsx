import React from 'react'
import { Box } from '@chakra-ui/react'
import PageLayout from '@shared/components/PDF/Layout'
import ReceiptBillPdf from '@modules/BillPdf/helpers/ReceiptBillPdf'
import { useParams } from 'react-router-dom'
import { useGetBillInfo } from '@shared/hooks/useBill'
import Loading from '@shared/components/Loading'

const ReceiptBill = () => {
  const { id } = useParams();
  const { data, isFetching } = useGetBillInfo(id as string);
  if (isFetching) return <Loading />
  return (
    <Box h={'100vh'}>
      <PageLayout>
        <ReceiptBillPdf data={data} />
      </PageLayout>
    </Box>
  )
}

export default ReceiptBill