import React, { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { price, asLetters } from '@web/shared/functions/words'
import { defaultId } from '@web/config'
import type { IBill } from '@web/shared/types/bills'

interface SettingsData {
  companyName?: string;
  rc?: string;
  nif?: string;
  ai?: string;
  nis?: string;
  companyAddress?: string;
  companyPhone?: string;
  mobile?: string;
  website?: string;
  email?: string;
  wilaya?: string;
  accountNumber?: string;
  rib?: string;
  articleNumber?: string;
  stamp?: number;
  tva?: number;
}

interface DocumentEditorProps {
  bill: IBill
  initialContent?: string
  settings?: SettingsData
}

export interface DocumentEditorHandle {
  getContent: () => string
}

function formatInvoiceNumber(num: number, year: string): string {
  if (num < 10) return `0000${num}/${year}`;
  if (num < 100) return `000${num}/${year}`;
  if (num < 1000) return `00${num}/${year}`;
  if (num < 10000) return `0${num}/${year}`;
  return `${num}/${year}`;
}

function fullHtml(bill: IBill, settings?: SettingsData): string {
  const customer = bill.customer as any
  const clientName = customer && customer._id !== defaultId ? customer?.fullname : t('counter')
  const isInvoice = bill.type === 'SALE'
  const showTownCity = customer?.town || customer?.city

  if (isInvoice) {
    const billYear = dayjs(bill.billDate).format('YYYY')
    const billDayFormatted = dayjs(bill.billDate).format('DD/MM/YYYY')
    const tvaRate = settings?.tva ?? 19
    const taxAmount = Number(bill.orderTotalHT) * tvaRate / 100
    const stampAmount = settings?.stamp ?? 0
    const totalTTC = Number(bill.orderTotalHT) + taxAmount - Number(bill.orderPaid || 0)

    const productRows = bill.products.map((p: any, k: number) => {
      const total = Number(p.buyPrice) * Number(p.quantity) * Number(p.stack)
      return `<tr style="flex-direction:row">
        <td style="width:5%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">${k + 1}</td>
        <td style="width:20%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">${p.barCode}</td>
        <td style="width:35%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">${p.productName}</td>
        <td style="width:10%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">${p.quantity}</td>
        <td style="width:14%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">${price(`${p.buyPrice}`)}</td>
        <td style="width:16%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">${price(`${total}`)}</td>
      </tr>`
    }).join('')

    const contactItems: {l:string;v:string}[] = []
    if (settings?.companyPhone) contactItems.push({ l:'T\u00E9l:', v: settings.companyPhone })
    if (settings?.mobile) contactItems.push({ l:'Mobile:', v: settings.mobile })
    if (settings?.website) contactItems.push({ l:'Site:', v: settings.website })
    if (settings?.email) contactItems.push({ l:'Email:', v: settings.email })

    let contactFooter = ''
    if (contactItems.length > 0) {
      const perRow = 2
      const rows: string[] = []
      for (let i = 0; i < contactItems.length; i += perRow) {
        const rowItems = contactItems.slice(i, i + perRow)
        const cols = rowItems.map((item, ri) =>
          `<div style="${ri > 0 ? 'border-left:0.3px solid #000;' : ''}padding:2px 6px;width:${100 / perRow}%"><span style="font-size:9px;font-weight:bold">${item.l} </span><span style="font-size:9px">${item.v}</span></div>`
        ).join('')
        rows.push(`<div style="display:flex;flex-direction:row;border-top:0.3px solid #000;font-size:9px">${cols}</div>`)
      }
      contactFooter = `<div style="margin-top:4px">${rows.join('')}</div>`
    }

    return `<div style="padding:20px;font-family:'Roboto Condensed',sans-serif;font-size:9px;line-height:1.4;color:#111">
      <div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;margin-bottom:18px">
        <div style="font-size:11px;font-weight:bold">${settings?.companyName || ''}</div>
        <div style="font-size:9px;text-align:right">${settings?.companyAddress ? `${settings.companyAddress} - ${settings.wilaya || ''}` : settings?.wilaya || ''}</div>
      </div>

      <table style="width:100%;margin-bottom:12px;border-collapse:collapse;font-size:9px">
        <tr><td style="width:70%"></td><td style="width:30%;text-align:right">RC: ${settings?.rc || ''}</td></tr>
        <tr><td style="width:70%;font-size:9px">Compte: ${settings?.accountNumber || ''}</td><td style="width:30%;text-align:right;border-top:0.5px dashed #000">NIF: ${settings?.nif || ''}</td></tr>
        <tr><td style="width:70%;font-size:9px">RIB: ${settings?.rib || ''}</td><td style="width:30%;text-align:right;border-top:0.5px dashed #000">Article: ${settings?.articleNumber || ''}</td></tr>
      </table>

      <hr style="border:none;border-bottom:1px solid #000;margin-bottom:10px" />

      <div style="display:flex;flex-direction:row;align-items:center;padding:5px 0;border-bottom:0.5px solid #000;margin-bottom:8px">
        <div style="width:41%"><div style="font-size:43px;font-weight:bold">FACTURE</div></div>
        <div style="width:27%;text-align:right"><span style="font-size:16px;font-weight:bold">N\u00B0: ${formatInvoiceNumber(bill.orderId, billYear)}</span></div>
        <div style="width:31%;text-align:right"><span style="font-size:16px;font-weight:bold">${settings?.wilaya || ''} le ${billDayFormatted}</span></div>
      </div>

      <div style="height:8px"></div>

      <table style="width:100%;margin-bottom:10px;border-collapse:collapse;font-size:9px">
        <tr>
          <td style="width:21.1%;font-weight:bold;font-size:9px">Paiement:</td>
          <td style="width:28.9%;font-size:9px">${bill.paymentMethod || ''}</td>
          <td style="width:21.1%;font-weight:bold;font-size:9px;text-align:right">RC:</td>
          <td style="width:28.9%;font-size:9px;padding-left:4px">${customer?.rc || ''}</td>
        </tr>
        <tr>
          <td style="width:21.1%;font-weight:bold;font-size:9px">Client:</td>
          <td style="width:28.9%;font-size:9px">${clientName}</td>
          <td style="width:21.1%;font-weight:bold;font-size:9px;text-align:right">NIF:</td>
          <td style="width:28.9%;font-size:9px;padding-left:4px">${customer?.nif || ''}</td>
        </tr>
        <tr>
          <td style="width:50%;font-weight:bold;font-size:9px" colspan="2">${showTownCity ? `${customer?.town ? customer.town.toUpperCase() : ''}${customer?.town && customer?.city ? ' W ' : ''}${customer?.city ? customer.city.toUpperCase() : ''}` : ''}</td>
          <td style="width:21.1%;font-weight:bold;font-size:9px;text-align:right">Article:</td>
          <td style="width:28.9%;font-size:9px;padding-left:4px">${customer?.nar || ''}</td>
        </tr>
      </table>

      <div style="height:6px"></div>

      <table style="width:100%;border-collapse:collapse;border-style:solid;border-width:0.5px;border-right-width:0;border-bottom-width:0;margin-bottom:10px">
        <thead>
          <tr style="background-color:#d6dfe0">
            <th style="width:5%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">#</th>
            <th style="width:20%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">Ref</th>
            <th style="width:35%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">D\u00E9signation</th>
            <th style="width:10%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">Qt\u00E9</th>
            <th style="width:14%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">PU</th>
            <th style="width:16%;border-style:solid;border-width:0.5px;border-left-width:0;border-top-width:0;padding:3px;font-size:9px;text-align:center">Total</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>

      <div style="display:flex;flex-direction:row;justify-content:flex-end;margin-bottom:8px">
        <div style="display:flex;flex-direction:row;justify-content:flex-end;width:40%">
          <span style="font-size:9px;font-weight:bold">Montant report\u00E9:  </span>
          <span style="font-size:9px">${price(`${bill.orderTotalHT}`)}</span>
        </div>
      </div>

      <div style="margin-top:20px">
        <div style="display:flex;flex-direction:row;margin-bottom:16px">
          <div style="width:60%;padding-right:8px">
            <div style="font-size:9px;font-weight:bold">Arr\u00EAt\u00E9 la pr\u00E9sente facture</div>
            <div style="font-size:9px;margin-top:2px">${asLetters(totalTTC)} TTC.</div>
          </div>
          <div style="width:40%;display:flex;flex-direction:column">
            <div style="display:flex;flex-direction:row">
              <div style="width:50%;border:0.3px solid #000;padding:3px;text-align:right"><span style="font-size:9px;font-weight:bold">Total HT:</span></div>
              <div style="width:50%;border:0.3px solid #000;border-left:0;padding:3px;text-align:right"><span style="font-size:9px">${price(`${bill.orderTotalHT}`)}</span></div>
            </div>
            <div style="display:flex;flex-direction:row">
              <div style="width:50%;border:0.3px solid #000;border-top:0;padding:3px;text-align:right"><span style="font-size:9px;font-weight:bold">TVA:</span></div>
              <div style="width:50%;border:0.3px solid #000;border-top:0;border-left:0;padding:3px;text-align:right"><span style="font-size:9px">${price(`${taxAmount}`)}</span></div>
            </div>
            <div style="display:flex;flex-direction:row">
              <div style="width:50%;border:0.3px solid #000;border-top:0;padding:3px;text-align:right"><span style="font-size:9px;font-weight:bold">Timbre:</span></div>
              <div style="width:50%;border:0.3px solid #000;border-top:0;border-left:0;padding:3px;text-align:right"><span style="font-size:9px">${price(`${stampAmount}`)}</span></div>
            </div>
            <div style="display:flex;flex-direction:row">
              <div style="width:50%;border:0.3px solid #000;border-top:0;padding:3px;text-align:right"><span style="font-size:9px;font-weight:bold">Net \u00E0 payer:</span></div>
              <div style="width:50%;border:0.3px solid #000;border-top:0;border-left:0;padding:3px;text-align:right"><span style="font-size:9px;font-weight:bold">${price(`${totalTTC}`)}</span></div>
            </div>
          </div>
        </div>

        <div style="margin-top:12px">
          <div style="font-size:14px;font-weight:bold">${settings?.companyName || ''}</div>
          <div style="font-size:9px;margin-top:4px">${settings?.companyAddress ? `${settings.companyAddress} - ${settings.wilaya || ''}` : settings?.wilaya || ''}</div>
        </div>

        ${contactFooter}

        ${bill.description ? `<div style="margin-top:8px;font-size:9px"><b>Notes:</b> ${bill.description}</div>` : ''}
      </div>
    </div>`
  }

  const productRows = bill.products.map((p: any, k: number) => {
    const productTotal = Number(p.buyPrice) * Number(p.quantity) * Number(p.stack)
    const productTva = Number(p.buyPrice) * Number(p.quantity) * Number(p.stack) * Number(p.tva || 0) / 100
    return `<tr style="flex-direction:row">
      <td style="width:5%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">${k + 1}</td>
      <td style="width:15%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">${p.barCode}</td>
      <td style="width:35%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">${p.productName}</td>
      <td style="width:10%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">${p.quantity} \u00D7 ${p.stack}</td>
      <td style="width:10%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center;font-weight:bold">${price(`${p.buyPrice}`)}</td>
      <td style="width:12.5%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center;font-weight:bold">${price(`${productTotal}`)}</td>
      <td style="width:12.5%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center;font-weight:bold">${price(`${productTotal + productTva}`)}</td>
    </tr>`
  }).join('')

  const billTypeLabel = bill.type === 'BUY' ? t('receiptBillId') : bill.type === 'ORDER' ? t('orderId') : t('deliveryBillId')

  return `<div style="padding:20px;font-family:sans-serif;font-size:10px;line-height:1.5;color:#111">
    <div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;font-size:12px">
      <div>
        <div style="display:flex;flex-direction:row;gap:2px">
          <span style="font-weight:bold">${t('customer')}:</span>
          <span>${clientName}</span>
        </div>
        <div style="display:flex;flex-direction:row;gap:2px;margin-top:2px">
          <span style="font-weight:bold">${t('date')}:</span>
          <span>${dayjs(bill.billDate).format('DD/MM/YYYY HH:mm:ss')}</span>
        </div>
      </div>
      <div style="background:#ddd;padding:10px 20px;border-radius:10px;margin-bottom:5px;font-size:16px;font-weight:bold">
        ${billTypeLabel}${bill.orderId}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #000;border-right-width:0;border-bottom-width:0">
      <thead>
        <tr style="background:#ddd;font-weight:bold">
          <th style="width:5%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">#</th>
          <th style="width:15%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">${t('reference')}</th>
          <th style="width:35%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">D\u00E9signation</th>
          <th style="width:10%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">Quantit\u00E9</th>
          <th style="width:10%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">Prix</th>
          <th style="width:12.5%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">Total (HT)</th>
          <th style="width:12.5%;border:1px solid #000;border-left-width:0;border-top-width:0;padding:5px 0;font-size:10px;text-align:center">Total (TTC)</th>
        </tr>
      </thead>
      <tbody>${productRows}</tbody>
    </table>
    <div style="display:flex;flex-direction:row;justify-content:space-between;margin-top:5px;font-size:10px">
      <div>${bill.description ? `<span><b>Note:</b> ${bill.description}</span>` : ''}</div>
      <div style="font-size:10px;text-align:left;display:flex;flex-direction:column;align-items:flex-end">
        <div style="display:flex;flex-direction:row;gap:2px">
          <span style="font-weight:bold">Totale (HT):</span>
          <span style="text-align:right;width:70px">${price(`${bill.orderTotalHT}`)} DA</span>
        </div>
        <div style="display:flex;flex-direction:row;gap:2px">
          <span style="font-weight:bold">Totale (TTC):</span>
          <span style="text-align:right;width:70px">${price(`${bill.orderTotalTTC}`)} DA</span>
        </div>
        <div style="display:flex;flex-direction:row;gap:2px">
          <span style="font-weight:bold">Versement:</span>
          <span style="text-align:right;width:70px">${price(`${bill.orderPaid}`)} DA</span>
        </div>
        <div style="display:flex;flex-direction:row;gap:2px">
          <span style="font-weight:bold">Dettes:</span>
          <span style="text-align:right;width:70px">${price(`${bill.orderDebts}`)} DA</span>
        </div>
        <div style="display:flex;flex-direction:row;gap:2px">
          <span style="font-weight:bold">M\u00E9thode de paiement:</span>
          <span style="text-align:right;width:70px">${bill.paymentMethod}</span>
        </div>
      </div>
    </div>
  </div>`
}

const ToolbarButton = ({ onClick, active, children, title }: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  title?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-sm leading-none
      ${active ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}
    `}
  >
    {children}
  </button>
)

const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(
  ({ bill, initialContent, settings }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const [selectionState, setSelectionState] = useState({ bold: false, italic: false })

    useImperativeHandle(ref, () => ({
      getContent: () => editorRef.current?.innerHTML || ''
    }), [])

    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent || fullHtml(bill, settings)
      }
    }, [])

    const exec = useCallback((cmd: string, val?: string) => {
      document.execCommand(cmd, false, val)
      editorRef.current?.focus()
    }, [])

    const handleMouseUp = useCallback(() => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
        setSelectionState({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
        })
      }
    }, [])

    useEffect(() => {
      document.addEventListener('selectionchange', handleMouseUp)
      return () => document.removeEventListener('selectionchange', handleMouseUp)
    }, [handleMouseUp])

    return (
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:mx-0">
        <div className="flex flex-wrap items-center gap-px px-2 py-1.5 border-b border-gray-300 bg-gray-50 print:hidden">
          <ToolbarButton onClick={() => exec('bold')} active={selectionState.bold} title="Bold"><strong>B</strong></ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} active={selectionState.italic} title="Italic"><em>I</em></ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="Underline"><span className="underline">U</span></ToolbarButton>
          <ToolbarButton onClick={() => exec('strikeThrough')} title="Strikethrough"><span className="line-through">S</span></ToolbarButton>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton onClick={() => exec('justifyLeft')} title="Left"><span>&#x2190;</span></ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyCenter')} title="Center"><span>&#x2194;</span></ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyRight')} title="Right"><span>&#x2192;</span></ToolbarButton>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Bullets"><span>&#8226;</span></ToolbarButton>
          <ToolbarButton onClick={() => exec('insertOrderedList')} title="Numbers"><span>1.</span></ToolbarButton>
          <div className="w-px h-5 bg-gray-300 mx-1" />
          <ToolbarButton onClick={() => exec('undo')} title="Undo"><span>&#x21B6;</span></ToolbarButton>
          <ToolbarButton onClick={() => exec('redo')} title="Redo"><span>&#x21B7;</span></ToolbarButton>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onMouseUp={handleMouseUp}
          onKeyUp={handleMouseUp}
          className="print:!p-0"
          style={{
            minHeight: '297mm',
            outline: 'none',
          }}
        />
      </div>
    )
  }
)

DocumentEditor.displayName = 'DocumentEditor'

export { fullHtml }
export default DocumentEditor
