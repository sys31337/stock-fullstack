import React, { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Image as ImageExtension } from '@tiptap/extension-image'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { price, asLetters } from '@web/shared/functions/words'
import { defaultId } from '@web/config'
import type { IBill } from '@web/shared/types/bills'
import FindReplace from './FindReplace'
import LinkDialog from './LinkDialog'
import ColorPicker from './ColorPicker'
import TableOfContents from './TableOfContents'

interface SettingsData {
  companyName?: string
  rc?: string
  nif?: string
  ai?: string
  nis?: string
  companyAddress?: string
  companyPhone?: string
  mobile?: string
  website?: string
  email?: string
  wilaya?: string
  accountNumber?: string
  rib?: string
  articleNumber?: string
  stamp?: number
  tva?: number
  tvaEnabled?: boolean
}

interface DocumentEditorProps {
  bill: IBill
  initialContent?: string
  settings?: SettingsData
}

export interface DocumentEditorHandle {
  getContent: () => string
}

function formatInvoiceNumber(num: number | string, year: string): string {
  num = Number(num);
  if (num < 10) return `0000${num}/${year}`
  if (num < 100) return `000${num}/${year}`
  if (num < 1000) return `00${num}/${year}`
  if (num < 10000) return `0${num}/${year}`
  return `${num}/${year}`
}

function fullHtml(bill: IBill, settings?: SettingsData): string {
  const customer = bill.customer as any
  const clientName = customer && customer._id !== defaultId ? customer?.fullname : t('counter')
  const isInvoice = bill.type === 'SALE'
  const showTownCity = customer?.town || customer?.city
  const tvaEnabled = settings?.tvaEnabled ?? true

  if (isInvoice) {
    const billYear = dayjs(bill.billDate).format('YYYY')
    const billDayFormatted = dayjs(bill.billDate).format('DD/MM/YYYY')
    const tvaRate = tvaEnabled ? (settings?.tva ?? 19) : 0
    const taxAmount = Number(bill.orderTotalHT) * tvaRate / 100
    const stampAmount = settings?.stamp ?? 0
    const totalTTC = Number(bill.orderTotalHT) + taxAmount - Number(bill.orderPaid || 0)
    const tvaRow = tvaEnabled
      ? `<div style="display:flex;flex-direction:row">
        <div style="width:50%;border:0.3px solid #000;border-top:0;padding:3px;text-align:right"><span style="font-size:9px;font-weight:bold">TVA:</span></div>
        <div style="width:50%;border:0.3px solid #000;border-top:0;border-left:0;padding:3px;text-align:right"><span style="font-size:9px">${price(`${taxAmount}`)}</span></div>
      </div>`
      : ''

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
            ${tvaRow}
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
    const productTva = tvaEnabled ? Number(p.buyPrice) * Number(p.quantity) * Number(p.stack) * Number(p.tva || 0) / 100 : 0
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

const ToolbarButton = ({ onClick, active, children, title, disabled }: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  title?: string
  disabled?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded hover:bg-gray-200 transition-colors text-sm leading-none
      ${active ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}
      ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
    `}
  >
    {children}
  </button>
)

const Divider = () => (
  <div className="w-px h-5 bg-gray-300 mx-1" />
)

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48']
const FONT_FAMILIES = ['sans-serif', 'serif', 'monospace', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Roboto Condensed']
const COLORS = ['#000000', '#333333', '#555555', '#888888', '#ffffff', '#ff0000', '#ff6600', '#ffcc00', '#00cc00', '#0066ff', '#9933ff', '#ff69b4']
const BG_COLORS = ['transparent', '#ffffff', '#ffffcc', '#ccffcc', '#ccffff', '#ccccff', '#ffcccc', '#ddd', '#d6dfe0']
const HIGHLIGHT_COLORS = ['#ffcc00', '#ff6600', '#00cc00', '#0066ff', '#ff69b4', '#ccffcc', '#ccffff', '#ccccff', '#ffcccc', '#ffffcc']

const DocumentEditor = forwardRef<DocumentEditorHandle, DocumentEditorProps>(
  ({ bill, initialContent, settings }, ref) => {
    const editorContainerRef = useRef<HTMLDivElement>(null)
    const [pageCount, setPageCount] = useState(1)
    const [showFindReplace, setShowFindReplace] = useState(false)
    const [showToc, setShowToc] = useState(false)
    const [linkDialogOpen, setLinkDialogOpen] = useState(false)

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4, 5, 6] },
          underline: false,
          link: false,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
        ImageExtension,
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Highlight.configure({
          multicolor: true,
        }),
        TextStyle,
        Color,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { target: '_blank' },
        }),
      ],
      content: initialContent || fullHtml(bill, settings),
      editorProps: {
        attributes: {
          class: 'focus:outline-none min-h-[297mm] px-[20px] py-[20px]',
        },
      },
    })

    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() || ''
    }), [editor])

    const updatePageCount = useCallback(() => {
      const container = editorContainerRef.current
      if (!container) return
      const height = container.scrollHeight
      const a4Height = container.clientHeight
      const count = Math.max(1, Math.ceil(height / a4Height))
      setPageCount(count)
    }, [])

    useEffect(() => {
      updatePageCount()
      const observer = new MutationObserver(updatePageCount)
      if (editorContainerRef.current) {
        observer.observe(editorContainerRef.current, { childList: true, subtree: true, characterData: true })
      }
      return () => observer.disconnect()
    }, [updatePageCount])

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault()
          setShowFindReplace(prev => !prev)
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
          e.preventDefault()
          setShowFindReplace(true)
        }
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, [])

    if (!editor) return null

    const setTableWidth = (width: string) => {
      const { state } = editor
      const { from, to } = state.selection
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'table') {
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, style: { ...node.attrs.style, width } })
            return true
          }).run()
        }
      })
    }

    const insertImage = () => {
      const url = window.prompt('Image URL:')
      if (url) editor.chain().focus().setImage({ src: url }).run()
    }

    const handleLinkInsert = (url: string) => {
      editor.chain().focus().setLink({ href: url }).run()
      setLinkDialogOpen(false)
    }

    const isInTable = editor.isActive('table')

    return (
      <div ref={editorContainerRef} className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg print:shadow-none print:rounded-none print:max-w-none print:mx-0">
        <div className="flex flex-wrap items-center gap-px px-2 py-1.5 border-b border-gray-300 bg-gray-50 print:hidden sticky top-0 z-10">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)"><strong>B</strong></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)"><em>I</em></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)"><span className="underline">U</span></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><span className="line-through">S</span></ToolbarButton>

          <div className="relative group">
            <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffcc00' }).run()} active={editor.isActive('highlight')} title="Highlight">
              <span className="px-0.5" style={{ background: '#ffcc00' }}>H</span>
            </ToolbarButton>
            <ColorPicker colors={HIGHLIGHT_COLORS} onSelect={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()} title="Highlight color" />
          </div>

          <Divider />

          <div className="relative">
            <select
              onChange={(e) => {
                const level = parseInt(e.target.value)
                if (level) editor.chain().focus().toggleHeading({ level: level as 1|2|3|4|5|6 }).run()
                e.target.value = ''
              }}
              defaultValue=""
              className="h-7 text-xs border border-gray-300 rounded px-1 bg-white cursor-pointer"
              title="Heading level"
            >
              <option value="" disabled>Heading</option>
              <option value="1">H1</option>
              <option value="2">H2</option>
              <option value="3">H3</option>
              <option value="4">H4</option>
              <option value="5">H5</option>
              <option value="6">H6</option>
            </select>
          </div>

          <div className="relative">
            <select
              onChange={(e) => {
                const size = e.target.value
                if (size) {
                  editor.chain().focus().setMark('textStyle', { fontSize: size + 'px' }).run()
                } else {
                  editor.chain().focus().unsetMark('textStyle').run()
                }
                e.target.value = ''
              }}
              defaultValue=""
              className="h-7 text-xs border border-gray-300 rounded px-1 bg-white cursor-pointer"
              title="Font size"
            >
              <option value="" disabled>Size</option>
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="relative">
            <select
              onChange={(e) => {
                const family = e.target.value
                if (family) {
                  editor.chain().focus().setMark('textStyle', { fontFamily: family }).run()
                } else {
                  editor.chain().focus().unsetMark('textStyle').run()
                }
                e.target.value = ''
              }}
              defaultValue=""
              className="h-7 text-xs border border-gray-300 rounded px-1 bg-white cursor-pointer max-w-[100px]"
              title="Font family"
            >
              <option value="" disabled>Font</option>
              {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <Divider />

          <div className="relative group">
            <button type="button" title="Text color" className="p-1.5 rounded hover:bg-gray-200 transition-colors text-sm leading-none">
              <span className="font-bold">A</span>
              <div className="h-0.5 w-3 mx-auto bg-red-500" />
            </button>
            <ColorPicker colors={COLORS} onSelect={(c) => editor.chain().focus().setColor(c).run()} title="Text color" />
          </div>

          <div className="relative group">
            <button type="button" title="Background color" className="p-1.5 rounded hover:bg-gray-200 transition-colors text-sm leading-none">
              <span className="font-bold px-0.5" style={{ background: '#ffcc00' }}>H</span>
            </button>
            <ColorPicker colors={BG_COLORS} onSelect={(c) => {
              if (c === 'transparent') {
                editor.chain().focus().unsetHighlight().run()
              } else {
                editor.chain().focus().toggleHighlight({ color: c }).run()
              }
            }} title="Background color" />
          </div>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">&#x2190;</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">&#x8596;</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">&#x2192;</ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">&#8226;</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1.</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()} title="Increase indent">&#x21E5;</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().liftListItem('listItem').run()} title="Decrease indent">&#x21E4;</ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">&ldquo;</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">&lt;/&gt;</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">&mdash;</ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => setLinkDialogOpen(true)} active={editor.isActive('link')} title="Insert link">&#x1F517;</ToolbarButton>
          <ToolbarButton onClick={insertImage} title="Insert image">&#x1F5BC;</ToolbarButton>

          <Divider />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">&#x21B6;</ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">&#x21B7;</ToolbarButton>

          {isInTable && (
            <>
              <Divider />
              <div className="flex items-center gap-px">
                <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Insert row above">&#x2191;R</ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Insert row below">&#x2193;R</ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Insert column left">&#x2190;C</ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Insert column right">&#x2192;C</ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">-R</ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">-C</ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().mergeCells().run()} title="Merge cells">&#x271A;</ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().splitCell().run()} title="Split cell">&#x2702;</ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">&#x2715;</ToolbarButton>
              </div>

              <Divider />

              <div className="relative group">
                <button type="button" title="Cell background" className="p-1.5 rounded hover:bg-gray-200 transition-colors text-sm leading-none">
                  <span>&#x25A3;</span>
                </button>
                <ColorPicker colors={BG_COLORS} onSelect={(c) => {
                  const { state } = editor
                  const { from, to } = state.selection
                  state.doc.nodesBetween(from, to, (node, pos) => {
                    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                      editor.chain().focus().command(({ tr }) => {
                        tr.setNodeMarkup(pos, undefined, {
                          ...node.attrs,
                          style: { ...node.attrs.style, backgroundColor: c === 'transparent' ? '' : c }
                        })
                        return true
                      }).run()
                    }
                  })
                }} title="Cell background color" />
              </div>

              <div className="relative">
                <select
                  onChange={(e) => {
                    const { state } = editor
                    const { from, to } = state.selection
                    state.doc.nodesBetween(from, to, (node, pos) => {
                      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
                        editor.chain().focus().command(({ tr }) => {
                          tr.setNodeMarkup(pos, undefined, {
                            ...node.attrs,
                            style: { ...node.attrs.style, borderWidth: e.target.value }
                          })
                          return true
                        }).run()
                      }
                    })
                    e.target.value = ''
                  }}
                  defaultValue=""
                  className="h-7 text-xs border border-gray-300 rounded px-1 bg-white cursor-pointer"
                  title="Border width"
                >
                  <option value="" disabled>Border</option>
                  <option value="0">None</option>
                  <option value="0.5px">0.5px</option>
                  <option value="1px">1px</option>
                  <option value="1.5px">1.5px</option>
                  <option value="2px">2px</option>
                </select>
              </div>

              <div className="relative">
                <select
                  onChange={(e) => setTableWidth(e.target.value)}
                  defaultValue=""
                  className="h-7 text-xs border border-gray-300 rounded px-1 bg-white cursor-pointer"
                  title="Table width"
                >
                  <option value="" disabled>Width</option>
                  <option value="100%">Full width</option>
                  <option value="75%">75%</option>
                  <option value="50%">50%</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </>
          )}

          <Divider />

          <ToolbarButton onClick={() => setShowFindReplace(prev => !prev)} title="Find & Replace (Ctrl+F)">&#x1F50D;</ToolbarButton>
          <ToolbarButton onClick={() => setShowToc(true)} title="Table of Contents">&#x2630;</ToolbarButton>

          <div className="ml-auto text-xs text-gray-500 select-none">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </div>
        </div>

        <FindReplace editor={editor} open={showFindReplace} onClose={() => setShowFindReplace(false)} />

        <div className="tiptap-editor print:!p-0" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent calc(297mm - 1px), #c0c0c0 calc(297mm - 1px), #c0c0c0 297mm)', backgroundSize: '100% 297mm' }}>
          <EditorContent editor={editor} />
        </div>

        {linkDialogOpen && <LinkDialog open={linkDialogOpen} initialUrl={editor.getAttributes('link').href || ''} onConfirm={handleLinkInsert} onCancel={() => setLinkDialogOpen(false)} />}
        {showToc && <TableOfContents editor={editor} open={showToc} onClose={() => setShowToc(false)} />}
      </div>
    )
  }
)

DocumentEditor.displayName = 'DocumentEditor'

export { fullHtml }
export default DocumentEditor
