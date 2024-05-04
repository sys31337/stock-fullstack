import React from 'react'
import { Box } from '@chakra-ui/react'
import PageLayout from '@web/shared/components/PDF/Layout'
import ReceiptBillPdf from '@web/modules/BillPdf/helpers/ReceiptBillPdf'
import { useParams } from 'react-router-dom'
import { useGetBillInfo } from '@web/shared/hooks/useBill'
import Loading from '@web/shared/components/Loading'

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