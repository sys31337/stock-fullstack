import React, { useState, useRef, useEffect, useCallback } from 'react'

interface FindReplaceProps {
  editorElement: HTMLDivElement | null
  open: boolean
  onClose: () => void
}

const HIGHLIGHT_CLASS = 'doc-search-highlight'

function getAllTextNodes(root: Node): Text[] {
  const textNodes: Text[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node)
  }
  return textNodes
}

function clearHighlights(container: HTMLElement) {
  const marks = container.querySelectorAll('.' + HIGHLIGHT_CLASS)
  marks.forEach(mark => {
    const parent = mark.parentNode
    if (parent) {
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
      parent.removeChild(mark)
      parent.normalize()
    }
  })
}

function highlightMatches(container: HTMLElement, search: string): number {
  clearHighlights(container)
  if (!search) return 0

  let count = 0
  const textNodes = getAllTextNodes(container)
  const lowerSearch = search.toLowerCase()

  for (const textNode of textNodes) {
    const text = textNode.textContent || ''
    const lowerText = text.toLowerCase()
    let startIndex = 0
    let matchIndex: number

    while ((matchIndex = lowerText.indexOf(lowerSearch, startIndex)) !== -1) {
      const range = document.createRange()
      range.setStart(textNode, matchIndex)
      range.setEnd(textNode, matchIndex + search.length)

      const mark = document.createElement('mark')
      mark.className = HIGHLIGHT_CLASS
      mark.style.background = '#ffeb3b'
      mark.style.padding = '0'
      mark.style.borderRadius = '2px'
      range.surroundContents(mark)
      count++
      startIndex = matchIndex + search.length
    }
  }
  return count
}

function goToMatch(container: HTMLElement, index: number): HTMLElement | null {
  const marks = container.querySelectorAll('.' + HIGHLIGHT_CLASS)
  marks.forEach((m, i) => {
    ;(m as HTMLElement).style.background = i === index ? '#ff9800' : '#ffeb3b'
  })
  const current = marks[index] as HTMLElement | undefined
  if (current) {
    current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return current || null
}

function replaceCurrentMatch(container: HTMLElement, replace: string, matchIndex: number): boolean {
  const marks = container.querySelectorAll('.' + HIGHLIGHT_CLASS)
  const mark = marks[matchIndex]
  if (!mark) return false
  const parent = mark.parentNode
  if (!parent) return false
  const textNode = document.createTextNode(replace)
  parent.replaceChild(textNode, mark)
  parent.normalize()
  return true
}

const FindReplace: React.FC<FindReplaceProps> = ({ editorElement, open, onClose }) => {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [open])

  const doSearch = useCallback(() => {
    if (!editorElement) return
    const count = highlightMatches(editorElement, search)
    setMatchCount(count)
    setCurrentIdx(count > 0 ? 0 : -1)
    if (count > 0) goToMatch(editorElement, 0)
  }, [editorElement, search])

  useEffect(() => { doSearch() }, [doSearch])

  const findNext = () => {
    if (!editorElement || matchCount === 0) return
    const next = (currentIdx + 1) % matchCount
    setCurrentIdx(next)
    goToMatch(editorElement, next)
  }

  const findPrev = () => {
    if (!editorElement || matchCount === 0) return
    const prev = (currentIdx - 1 + matchCount) % matchCount
    setCurrentIdx(prev)
    goToMatch(editorElement, prev)
  }

  const replaceOne = () => {
    if (!editorElement || matchCount === 0) return
    replaceCurrentMatch(editorElement, replace, currentIdx)
    doSearch()
  }

  const replaceAll = () => {
    if (!editorElement || !search) return
    let remaining = matchCount
    while (remaining > 0) {
      replaceCurrentMatch(editorElement, replace, 0)
      remaining--
    }
    doSearch()
  }

  const handleClose = () => {
    if (editorElement) clearHighlights(editorElement)
    setSearch('')
    setReplace('')
    setMatchCount(0)
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
        onKeyDown={e => { if (e.key === 'Enter') findNext(); if (e.key === 'Escape') handleClose() }}
        placeholder="Find..."
        className="px-2 py-1 text-xs border border-gray-300 rounded w-[160px] focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <span className="text-xs text-gray-500 min-w-[60px]">
        {search ? `${currentIdx >= 0 ? currentIdx + 1 : 0}/${matchCount}` : '0 results'}
      </span>
      <button type="button" onClick={findPrev} disabled={!search} className="p-1 text-xs rounded hover:bg-gray-200 disabled:opacity-40" title="Previous">&#x25B2;</button>
      <button type="button" onClick={findNext} disabled={!search} className="p-1 text-xs rounded hover:bg-gray-200 disabled:opacity-40" title="Next">&#x25BC;</button>
      <div className="w-px h-4 bg-gray-300 mx-1" />
      <input
        type="text"
        value={replace}
        onChange={e => setReplace(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') handleClose() }}
        placeholder="Replace..."
        className="px-2 py-1 text-xs border border-gray-300 rounded w-[160px] focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button type="button" onClick={replaceOne} disabled={!search} className="px-2 py-1 text-xs rounded hover:bg-gray-200 disabled:opacity-40 border border-gray-300">Replace</button>
      <button type="button" onClick={replaceAll} disabled={!search} className="px-2 py-1 text-xs rounded hover:bg-gray-200 disabled:opacity-40 border border-gray-300">All</button>
      <button type="button" onClick={handleClose} className="p-1 text-xs rounded hover:bg-gray-200 ml-1" title="Close">&#x2715;</button>
    </div>
  )
}

export default FindReplace
