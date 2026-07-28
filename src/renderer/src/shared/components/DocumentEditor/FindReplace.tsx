import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'

interface FindReplaceProps {
  editor: Editor
  open: boolean
  onClose: () => void
}

interface MatchRange {
  from: number
  to: number
}

function findAllMatches(editor: Editor, search: string): MatchRange[] {
  if (!search) return []
  const matches: MatchRange[] = []
  const lowerSearch = search.toLowerCase()
  const { doc } = editor.state

  doc.descendants((node, pos) => {
    if (!node.isText) return
    const text = node.textContent.toLowerCase()
    let startIdx = 0
    while ((startIdx = text.indexOf(lowerSearch, startIdx)) !== -1) {
      matches.push({ from: pos + startIdx, to: pos + startIdx + search.length })
      startIdx += search.length
    }
  })
  return matches
}

const FindReplace: React.FC<FindReplaceProps> = ({ editor, open, onClose }) => {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const [matches, setMatches] = useState<MatchRange[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    const found = findAllMatches(editor, search)
    setMatches(found)
    setCurrentIdx(found.length > 0 ? 0 : -1)
    if (found.length > 0) {
      editor.chain().focus().setTextSelection(found[0]).scrollIntoView().run()
    }
  }, [editor, search])

  const goTo = useCallback((idx: number) => {
    if (matches.length === 0) return
    const range = matches[idx]
    editor.chain().focus().setTextSelection(range).scrollIntoView().run()
  }, [editor, matches])

  const findNext = () => {
    if (matches.length === 0) return
    const next = (currentIdx + 1) % matches.length
    setCurrentIdx(next)
    goTo(next)
  }

  const findPrev = () => {
    if (matches.length === 0) return
    const prev = (currentIdx - 1 + matches.length) % matches.length
    setCurrentIdx(prev)
    goTo(prev)
  }

  const replaceOne = () => {
    if (matches.length === 0 || currentIdx < 0) return
    const range = matches[currentIdx]
    editor.chain().focus().deleteRange(range).insertContentAt(range.from, replace).run()
    const newMatches = findAllMatches(editor, search)
    setMatches(newMatches)
    setCurrentIdx(newMatches.length > 0 ? Math.min(currentIdx, newMatches.length - 1) : -1)
    if (newMatches.length > 0) {
      const nextIdx = Math.min(currentIdx, newMatches.length - 1)
      editor.chain().focus().setTextSelection(newMatches[nextIdx]).scrollIntoView().run()
    }
  }

  const replaceAll = () => {
    if (matches.length === 0) return
    editor.chain().focus().selectAll().run()
    const allMatches = findAllMatches(editor, search)
    for (let i = allMatches.length - 1; i >= 0; i--) {
      const range = allMatches[i]
      editor.chain().deleteRange(range).insertContentAt(range.from, replace).run()
    }
    const newMatches = findAllMatches(editor, search)
    setMatches(newMatches)
    setCurrentIdx(newMatches.length > 0 ? 0 : -1)
  }

  const handleClose = () => {
    setSearch('')
    setReplace('')
    setMatches([])
    setCurrentIdx(-1)
    onClose()
  }

  if (!open) return null

  return (
    <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex flex-wrap items-center gap-2 print:hidden">
      <input
        ref={searchInputRef}
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.shiftKey ? findPrev() : findNext() }; if (e.key === 'Escape') handleClose() }}
        placeholder="Find..."
        className="px-2 py-1 text-xs border border-gray-300 rounded w-[160px] focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <span className="text-xs text-gray-500 min-w-[60px]">
        {search ? `${currentIdx >= 0 ? currentIdx + 1 : 0}/${matches.length}` : '0 results'}
      </span>
      <button type="button" onClick={findPrev} disabled={!search || matches.length === 0} className="p-1 text-xs rounded hover:bg-gray-200 disabled:opacity-40" title="Previous (Shift+Enter)">&#x25B2;</button>
      <button type="button" onClick={findNext} disabled={!search || matches.length === 0} className="p-1 text-xs rounded hover:bg-gray-200 disabled:opacity-40" title="Next (Enter)">&#x25BC;</button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <input
        type="text"
        value={replace}
        onChange={e => setReplace(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') handleClose() }}
        placeholder="Replace..."
        className="px-2 py-1 text-xs border border-gray-300 rounded w-[160px] focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button type="button" onClick={replaceOne} disabled={!search || matches.length === 0} className="px-2 py-1 text-xs rounded hover:bg-gray-200 disabled:opacity-40 border border-gray-300">Replace</button>
      <button type="button" onClick={replaceAll} disabled={!search || matches.length === 0} className="px-2 py-1 text-xs rounded hover:bg-gray-200 disabled:opacity-40 border border-gray-300">All</button>
      <button type="button" onClick={handleClose} className="p-1 text-xs rounded hover:bg-gray-200 ml-1" title="Close (Escape)">&#x2715;</button>
    </div>
  )
}

export default FindReplace
