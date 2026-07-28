import React, { useState, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'

interface TocItem {
  level: number
  text: string
  pos: number
}

interface TableOfContentsProps {
  editor: Editor
  open: boolean
  onClose: () => void
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ editor, open, onClose }) => {
  const [items, setItems] = useState<TocItem[]>([])

  const buildToc = useCallback(() => {
    const headings: TocItem[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        headings.push({
          level: node.attrs.level,
          text: node.textContent,
          pos,
        })
      }
    })
    setItems(headings)
  }, [editor])

  useEffect(() => {
    buildToc()
    editor.on('update', buildToc)
    return () => {
      editor.off('update', buildToc)
    }
  }, [editor, buildToc])

  const scrollToHeading = (pos: number) => {
    editor.commands.focus()
    editor.commands.setTextSelection(pos)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onMouseDown={onClose}>
      <div
        className="bg-white border border-gray-200 shadow-xl rounded-lg p-4 w-[320px] max-h-[400px] flex flex-col"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Table of Contents</span>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">&#x2715;</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="text-xs text-gray-400 py-4 text-center">No headings found</div>
          ) : (
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => scrollToHeading(item.pos)}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 text-gray-700 truncate"
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                  >
                    <span className="text-gray-400 mr-1">H{item.level}</span>
                    {item.text || '(empty)'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default TableOfContents
