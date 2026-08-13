import React, { useRef, useCallback, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Image as ImageExtension } from '@tiptap/extension-image'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { TextStyle, FontSize, FontFamily, LineHeight } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { StyledTable, StyledTableCell, StyledTableHeader, TableRow } from './tableExtensions'
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

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fullHtml(bill: IBill, settings?: SettingsData): string {
  const customer = bill.customer as any
  const clientName = customer && customer._id !== defaultId ? customer?.fullname : t('counter')
  const isInvoice = bill.type === 'SALE'
  const showTownCity = customer?.town || customer?.city
  const tvaEnabled = settings?.tvaEnabled ?? true

  const companyName = esc(settings?.companyName || '')
  const companyAddress = settings?.companyAddress
    ? `${esc(settings.companyAddress)}${settings?.wilaya ? ` - ${esc(settings.wilaya)}` : ''}`
    : esc(settings?.wilaya || '')

  if (isInvoice) {
    const billYear = dayjs(bill.billDate).format('YYYY')
    const billDayFormatted = dayjs(bill.billDate).format('DD/MM/YYYY')
    const tvaRate = tvaEnabled ? (settings?.tva ?? 19) : 0
    const taxAmount = Number(bill.orderTotalHT) * tvaRate / 100
    const stampAmount = settings?.stamp ?? 0
    const totalTTC = Number(bill.orderTotalHT) + taxAmount - Number(bill.orderPaid || 0)

    const productRows = bill.products.map((p: any, k: number) => {
      const total = Number(p.buyPrice) * Number(p.quantity) * Number(p.stack)
      return `<tr>
        <td align="center" style="width:5%;border:0.5px solid #000;padding:3px;font-size:9px">${k + 1}</td>
        <td align="center" style="width:20%;border:0.5px solid #000;padding:3px;font-size:9px">${esc(p.barCode)}</td>
        <td align="center" style="width:35%;border:0.5px solid #000;padding:3px;font-size:9px">${esc(p.productName)}</td>
        <td align="center" style="width:10%;border:0.5px solid #000;padding:3px;font-size:9px">${Number(p.quantity)}</td>
        <td align="center" style="width:14%;border:0.5px solid #000;padding:3px;font-size:9px">${price(`${p.buyPrice}`)}</td>
        <td align="center" style="width:16%;border:0.5px solid #000;padding:3px;font-size:9px">${price(`${total}`)}</td>
      </tr>`
    }).join('')

    const tvaRow = tvaEnabled ? `<tr>
      <td>&nbsp;</td>
      <td align="right" style="width:22.5%;border:0.3px solid #000;border-top:0;padding:3px;font-size:9px"><b>TVA:</b></td>
      <td align="right" style="width:22.5%;border:0.3px solid #000;border-left:0;border-top:0;padding:3px;font-size:9px">${price(`${taxAmount}`)}</td>
    </tr>` : ''

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
          `<td style="${ri > 0 ? 'border-left:0.3px solid #000;' : ''}padding:2px 6px;width:${100 / perRow}%;font-size:9px;border-top:0.3px solid #000"><b>${item.l} </b>${esc(item.v)}</td>`
        ).join('')
        rows.push(`<tr>${cols}</tr>`)
      }
      contactFooter = `<table style="width:100%;border-collapse:collapse;margin-top:4px">${rows.join('')}</table>`
    }

    return `
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr>
    <td style="width:60%;font-size:11px;font-weight:bold">${companyName}</td>
    <td align="right" style="width:40%;font-size:9px">${companyAddress}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:4px">
  <tr>
    <td style="width:70%;font-size:9px">&nbsp;</td>
    <td align="right" style="width:30%;font-size:9px">RC: ${esc(settings?.rc || '')}</td>
  </tr>
  <tr>
    <td style="width:70%;font-size:9px">Compte: ${esc(settings?.accountNumber || '')}</td>
    <td align="right" style="width:30%;font-size:9px;border-top:0.5px dashed #000">NIF: ${esc(settings?.nif || '')}</td>
  </tr>
  <tr>
    <td style="width:70%;font-size:9px">RIB: ${esc(settings?.rib || '')}</td>
    <td align="right" style="width:30%;font-size:9px;border-top:0.5px dashed #000">Article: ${esc(settings?.articleNumber || '')}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:4px">
  <tr><td style="border-top:1px solid #000">&nbsp;</td></tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr>
    <td style="width:41%;font-size:43px;font-weight:bold;padding-bottom:2px;border-bottom:0.5px solid #000">FACTURE</td>
    <td align="right" style="width:27%;font-size:16px;font-weight:bold;padding-bottom:2px;border-bottom:0.5px solid #000;vertical-align:bottom">N\u00B0: ${formatInvoiceNumber(bill.orderId, billYear)}</td>
    <td align="right" style="width:32%;font-size:16px;font-weight:bold;padding-bottom:2px;border-bottom:0.5px solid #000;vertical-align:bottom">${esc(settings?.wilaya || '')} le ${billDayFormatted}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr>
    <td style="width:21.1%;font-size:9px"><b>Paiement:</b></td>
    <td style="width:28.9%;font-size:9px">${esc(bill.paymentMethod || '')}</td>
    <td align="right" style="width:21.1%;font-size:9px"><b>RC:</b></td>
    <td style="width:28.9%;font-size:9px;padding-left:4px">${esc(customer?.rc || '')}</td>
  </tr>
  <tr>
    <td style="width:21.1%;font-size:9px"><b>Client:</b></td>
    <td style="width:28.9%;font-size:9px">${esc(clientName)}</td>
    <td align="right" style="width:21.1%;font-size:9px"><b>NIF:</b></td>
    <td style="width:28.9%;font-size:9px;padding-left:4px">${esc(customer?.nif || '')}</td>
  </tr>
  <tr>
    <td style="width:50%;font-size:9px" colspan="2">${showTownCity ? esc(`${customer?.town ? customer.town.toUpperCase() : ''}${customer?.town && customer?.city ? ' W ' : ''}${customer?.city ? customer.city.toUpperCase() : ''}`) : '&nbsp;'}</td>
    <td align="right" style="width:21.1%;font-size:9px"><b>Article:</b></td>
    <td style="width:28.9%;font-size:9px;padding-left:4px">${esc(customer?.nar || '')}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr>
    <th align="center" style="width:5%;border:0.5px solid #000;padding:3px;font-size:9px;background:#d6dfe0">#</th>
    <th align="center" style="width:20%;border:0.5px solid #000;padding:3px;font-size:9px;background:#d6dfe0">Ref</th>
    <th align="center" style="width:35%;border:0.5px solid #000;padding:3px;font-size:9px;background:#d6dfe0">D\u00E9signation</th>
    <th align="center" style="width:10%;border:0.5px solid #000;padding:3px;font-size:9px;background:#d6dfe0">Qt\u00E9</th>
    <th align="center" style="width:14%;border:0.5px solid #000;padding:3px;font-size:9px;background:#d6dfe0">PU</th>
    <th align="center" style="width:16%;border:0.5px solid #000;padding:3px;font-size:9px;background:#d6dfe0">Total</th>
  </tr>
  ${productRows}
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr>
    <td style="width:60%">&nbsp;</td>
    <td align="right" style="width:40%;font-size:9px"><b>Montant report\u00E9:</b> ${price(`${bill.orderTotalHT}`)}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr>
    <td style="width:55%;font-size:9px;vertical-align:top;padding-right:8px"><b>Arr\u00EAt\u00E9 la pr\u00E9sente facture</b><br/>${esc(asLetters(totalTTC))} TTC.</td>
    <td align="right" style="width:22.5%;border:0.3px solid #000;padding:3px;font-size:9px"><b>Total HT:</b></td>
    <td align="right" style="width:22.5%;border:0.3px solid #000;border-left:0;padding:3px;font-size:9px">${price(`${bill.orderTotalHT}`)}</td>
  </tr>
  ${tvaRow}
  <tr>
    <td>&nbsp;</td>
    <td align="right" style="width:22.5%;border:0.3px solid #000;border-top:0;padding:3px;font-size:9px"><b>Timbre:</b></td>
    <td align="right" style="width:22.5%;border:0.3px solid #000;border-left:0;border-top:0;padding:3px;font-size:9px">${price(`${stampAmount}`)}</td>
  </tr>
  <tr>
    <td>&nbsp;</td>
    <td align="right" style="width:22.5%;border:0.3px solid #000;border-top:0;padding:3px;font-size:9px"><b>Net \u00E0 payer:</b></td>
    <td align="right" style="width:22.5%;border:0.3px solid #000;border-left:0;border-top:0;padding:3px;font-size:9px"><b>${price(`${totalTTC}`)}</b></td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-top:10px">
  <tr>
    <td style="width:60%;font-size:14px;font-weight:bold">${companyName}</td>
    <td>&nbsp;</td>
  </tr>
  <tr>
    <td style="width:60%;font-size:9px">${companyAddress}</td>
    <td>&nbsp;</td>
  </tr>
</table>
${contactFooter}
${bill.description ? `<table style="width:100%;border-collapse:collapse;margin-top:6px"><tr><td style="font-size:9px"><b>Notes:</b> ${esc(bill.description)}</td></tr></table>` : ''}`
  }

  const productRows = bill.products.map((p: any, k: number) => {
    const productTotal = Number(p.buyPrice) * Number(p.quantity) * Number(p.stack)
    const productTva = tvaEnabled ? Number(p.buyPrice) * Number(p.quantity) * Number(p.stack) * Number(p.tva || 0) / 100 : 0
    return `<tr>
      <td align="center" style="width:5%;border:1px solid #000;padding:5px 0;font-size:10px">${k + 1}</td>
      <td align="center" style="width:15%;border:1px solid #000;padding:5px 0;font-size:10px">${esc(p.barCode)}</td>
      <td align="center" style="width:35%;border:1px solid #000;padding:5px 0;font-size:10px">${esc(p.productName)}</td>
      <td align="center" style="width:10%;border:1px solid #000;padding:5px 0;font-size:10px">${Number(p.quantity)} \u00D7 ${Number(p.stack)}</td>
      <td align="center" style="width:10%;border:1px solid #000;padding:5px 0;font-size:10px;font-weight:bold">${price(`${p.buyPrice}`)}</td>
      <td align="center" style="width:12.5%;border:1px solid #000;padding:5px 0;font-size:10px;font-weight:bold">${price(`${productTotal}`)}</td>
      <td align="center" style="width:12.5%;border:1px solid #000;padding:5px 0;font-size:10px;font-weight:bold">${price(`${productTotal + productTva}`)}</td>
    </tr>`
  }).join('')

  const billTypeLabel = bill.type === 'BUY' ? t('receiptBillId') : bill.type === 'ORDER' ? t('orderId') : t('deliveryBillId')

  return `
<table style="width:100%;border-collapse:collapse;margin-bottom:8px">
  <tr>
    <td style="width:55%;font-size:12px;vertical-align:top">
      <b>${esc(t('customer'))}:</b> ${esc(clientName)}<br/>
      <b>${esc(t('date'))}:</b> ${dayjs(bill.billDate).format('DD/MM/YYYY HH:mm:ss')}
    </td>
    <td align="center" style="width:45%;font-size:16px;font-weight:bold;background:#ddd;padding:10px 20px;border-radius:10px">${esc(billTypeLabel)}${esc(bill.orderId)}</td>
  </tr>
</table>
<table style="width:100%;border-collapse:collapse;margin-bottom:5px">
  <tr>
    <th align="center" style="width:5%;border:1px solid #000;padding:5px 0;font-size:10px;background:#ddd">#</th>
    <th align="center" style="width:15%;border:1px solid #000;padding:5px 0;font-size:10px;background:#ddd">${esc(t('reference'))}</th>
    <th align="center" style="width:35%;border:1px solid #000;padding:5px 0;font-size:10px;background:#ddd">D\u00E9signation</th>
    <th align="center" style="width:10%;border:1px solid #000;padding:5px 0;font-size:10px;background:#ddd">Quantit\u00E9</th>
    <th align="center" style="width:10%;border:1px solid #000;padding:5px 0;font-size:10px;background:#ddd">Prix</th>
    <th align="center" style="width:12.5%;border:1px solid #000;padding:5px 0;font-size:10px;background:#ddd">Total (HT)</th>
    <th align="center" style="width:12.5%;border:1px solid #000;padding:5px 0;font-size:10px;background:#ddd">Total (TTC)</th>
  </tr>
  ${productRows}
</table>
<table style="width:100%;border-collapse:collapse;margin-top:5px">
  <tr>
    <td style="width:50%;font-size:10px;vertical-align:top">${bill.description ? `<b>Note:</b> ${esc(bill.description)}` : '&nbsp;'}</td>
    <td align="right" style="width:50%;font-size:10px">
      <b>Totale (HT):</b> ${price(`${bill.orderTotalHT}`)} DA<br/>
      <b>Totale (TTC):</b> ${price(`${bill.orderTotalTTC}`)} DA<br/>
      <b>Versement:</b> ${price(`${bill.orderPaid}`)} DA<br/>
      <b>Dettes:</b> ${price(`${bill.orderDebts}`)} DA
    </td>
  </tr>
</table>`
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
        StyledTable.configure({
          resizable: true,
        }),
        StyledTableCell,
        StyledTableHeader,
        TableRow,
        ImageExtension,
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Highlight.configure({
          multicolor: true,
        }),
        TextStyle,
        FontSize,
        FontFamily,
        LineHeight,
        Color,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { target: '_blank' },
        }),
      ],
      content: initialContent || fullHtml(bill, settings),
      editorProps: {
        attributes: {
          class: 'focus:outline-none bill-document min-h-[297mm] px-[20px] py-[20px]',
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

    const setStyleProperty = (style: unknown, prop: string, value: string): string => {
      const parts = (typeof style === 'string' ? style : '').split(';').map(p => p.trim()).filter(Boolean)
      const idx = parts.findIndex(p => p.split(':')[0]?.trim().toLowerCase() === prop.toLowerCase())
      if (idx >= 0) parts.splice(idx, 1)
      if (value !== '') parts.push(`${prop}: ${value}`)
      return parts.join(';')
    }

    const setTableWidth = (width: string) => {
      const { state } = editor
      const { from, to } = state.selection
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'table') {
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              style: setStyleProperty(node.attrs.style, 'width', width === 'auto' ? '' : width),
            })
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
                          style: setStyleProperty(node.attrs.style, 'background-color', c === 'transparent' ? '' : c),
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
                            style: setStyleProperty(node.attrs.style, 'border-width', e.target.value),
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
