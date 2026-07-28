import React, { useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetBillInfo } from '@web/shared/hooks/useBill'
import { useGetSettings } from '@web/shared/hooks/useSettings'
import axiosInstance from '@web/shared/services/api'
import Loading from '@web/shared/components/Loading'
import { Button } from '@web/shared/components/ui/button'
import { AiOutlineClose, AiOutlineEdit, AiOutlineFilePdf, AiOutlineHistory, AiOutlineSave } from 'react-icons/ai'
import { t } from 'i18next'
import DocumentEditor, { DocumentEditorHandle, fullHtml } from '@web/shared/components/DocumentEditor'
import HistoryViewer from '@web/shared/components/HistoryViewer'
import { useToast } from '@web/shared/components/ui/use-toast'
import showToast from '@web/shared/functions/showToast'
import type { IContentHistoryEntry } from '@web/shared/types/bills'

type ViewMode = 'view' | 'edit' | 'history'

const ReceiptBill: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isFetching, refetch } = useGetBillInfo(id as string)
  const { data: settings } = useGetSettings()

  const [mode, setMode] = useState<ViewMode>('view')
  const [saveDescription, setSaveDescription] = useState('')
  const [initialContent, setInitialContent] = useState<string | undefined>(undefined)
  const [editorKey, setEditorKey] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const editorRef = useRef<DocumentEditorHandle>(null)

  const handleSave = useCallback(async () => {
    if (!id) return
    setIsSaving(true)
    try {
      const content = editorRef.current?.getContent()
      if (!content) {
        showToast(toast, {
          title: 'Error',
          description: 'Editor not ready - please try again',
          status: 'error',
          duration: 3000,
        })
        setIsSaving(false)
        return
      }
      const response = await axiosInstance.request({
        method: 'PUT',
        url: `bills/info/${id}/content`,
        data: {
          content,
          description: saveDescription || 'Content edited',
        },
      })
      console.log('Save response:', response.status, response.data?._id)
      await refetch()
      setInitialContent(content)
      setEditorKey(k => k + 1)
      showToast(toast, {
        title: t('saved') || 'Saved',
        description: t('contentSaved') || 'Document content saved successfully',
        status: 'success',
      })
      setSaveDescription('')
      setIsSaving(false)
    } catch (error: any) {
      console.error('Save failed:', error)
      const status = error?.response?.status
      const msg = error?.response?.data?.message || error?.message || 'Unknown error'
      showToast(toast, {
        title: `Save failed${status ? ` (${status})` : ''}`,
        description: msg,
        status: 'error',
        duration: 5000,
      })
      setIsSaving(false)
    }
  }, [id, saveDescription, refetch])

  const handleEdit = useCallback(() => {
    if (mode === 'edit') {
      setMode('view')
    } else {
      setInitialContent(data?.content || undefined)
      setEditorKey(k => k + 1)
      setMode('edit')
    }
  }, [mode, data])

  const handleRestore = useCallback((entry: IContentHistoryEntry) => {
    setInitialContent(entry.content)
    setEditorKey(k => k + 1)
    setSaveDescription(`Restored version from ${new Date(entry.editedAt).toLocaleString()}`)
    setMode('edit')
  }, [])

  const handleHistory = useCallback(() => {
    if (mode !== 'history') {
      setMode('history')
    } else {
      setMode('view')
    }
  }, [mode])

  const handlePrint = useCallback(() => {
    const content = mode === 'edit'
      ? editorRef.current?.getContent()
      : (data?.content || fullHtml(data!, settings || undefined))
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)
    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) { document.body.removeChild(iframe); window.print(); return }
    iframeDoc.open()
    iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; }
  table { border-collapse: collapse; }
  tr, th, td { break-inside: avoid; page-break-inside: avoid; }
  h1, h2, h3, h4 { break-after: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  @media print { body { zoom: 1.3; } }
</style>
</head>
<body>${content}</body>
</html>`)
    iframeDoc.close()
    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe) }, 500)
    }, 200)
  }, [mode, data, settings])

  if (isFetching) return <Loading />

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-950">
      <header className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10 print:hidden">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={t('close') || 'Close'}
          >
            <AiOutlineClose className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {data?.type === 'SALE' ? t('invoice') || 'Invoice' :
             data?.type === 'BUY' ? t('receipt') || 'Receipt' :
             data?.type === 'ORDER' ? t('order') || 'Order' :
             t('delivery') || 'Delivery'} #{data?.orderId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleEdit}
            variant={mode === 'edit' ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            title={t('toggleEdit') || 'Toggle edit mode'}
          >
            <AiOutlineEdit className="w-3.5 h-3.5 mr-1" />
            {mode === 'edit' ? t('viewPdf') || 'View PDF' : t('edit') || 'Edit'}
          </Button>

          <Button
            onClick={handleHistory}
            variant={mode === 'history' ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            title={t('history') || 'History'}
          >
            <AiOutlineHistory className="w-3.5 h-3.5 mr-1" />
            {t('history') || 'History'}
          </Button>

          {mode === 'edit' && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="default"
              size="sm"
              className="h-8 text-xs bg-green-600 hover:bg-green-700"
              title={t('save') || 'Save'}
            >
              <AiOutlineSave className="w-3.5 h-3.5 mr-1" />
              {isSaving ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
            </Button>
          )}

          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            title={t('print') || 'Print'}
          >
            <AiOutlineFilePdf className="w-3.5 h-3.5 mr-1" />
            {t('print') || 'Print'}
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative print:overflow-visible">
        <div className={mode === 'view' ? 'absolute inset-0 print:static print:inset-auto' : 'hidden'}>
          <div
            className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none print:mx-0 print:max-w-none"
            style={{ minHeight: '297mm' }}
            dangerouslySetInnerHTML={{ __html: data?.content || fullHtml(data!, settings || undefined) }}
          />
        </div>

        {mode === 'edit' && (
          <div className="p-6 print:p-0">
            <DocumentEditor
              key={editorKey}
              ref={editorRef}
              bill={data!}
              initialContent={initialContent}
              settings={settings || undefined}
            />
            <div className="max-w-[210mm] mx-auto mt-4 print:hidden">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('changeDescription') || 'Change description (optional)'}
              </label>
              <input
                type="text"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder={t('describeChange') || 'Describe what changed...'}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded
                  bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300
                  focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {mode === 'history' && (
          <div className="p-6 max-w-[210mm] mx-auto print:hidden">
            <HistoryViewer
              history={data?.contentHistory || []}
              onRestore={handleRestore}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default ReceiptBill
