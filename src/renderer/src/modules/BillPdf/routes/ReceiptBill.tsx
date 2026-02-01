import React from 'react'
import ReceiptBillPdf from '@web/modules/BillPdf/helpers/ReceiptBillPdf'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetBillInfo } from '@web/shared/hooks/useBill'
import Loading from '@web/shared/components/Loading'
import { PDFViewer } from '@react-pdf/renderer'
import { Button } from '@web/shared/components/ui/button'
import { AiOutlineClose } from 'react-icons/ai'
import { t } from 'i18next'

const ReceiptBill: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isFetching } = useGetBillInfo(id as string);

  if (isFetching) return <Loading />

  return (
    <div className="relative h-screen w-screen m-0 p-0 overflow-hidden">
      {/* Floating Close Button */}
      <div className="absolute top-4 right-6 z-50">
        <Button
          onClick={() => navigate(-1)}
          variant="destructive"
          className="shadow-lg rounded-full h-10 w-10 p-0 flex items-center justify-center hover:scale-105 transition-transform"
          title={t('close')}
        >
          <AiOutlineClose className="w-5 h-5 text-white" />
        </Button>
      </div>

      <PDFViewer width="100%" height="100%" style={{ margin: 0, padding: 0, border: 'none' }} showToolbar={true}>
        <ReceiptBillPdf data={data} />
      </PDFViewer>
    </div>
  )
}

export default ReceiptBill
