import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

const styleAttribute = () => ({
  default: null as string | null,
  parseHTML: (element: HTMLElement) => element.getAttribute('style'),
  renderHTML: (attributes: Record<string, unknown>) => {
    if (!attributes.style) return {}
    return { style: attributes.style }
  },
})

export const StyledTable = Table.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      style: styleAttribute(),
    }
  },
})

export const StyledTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      style: styleAttribute(),
    }
  },
})

export const StyledTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      style: styleAttribute(),
    }
  },
})

export { TableRow }
