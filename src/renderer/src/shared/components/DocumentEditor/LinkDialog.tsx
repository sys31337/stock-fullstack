import React, { useState, useEffect, useRef } from 'react'

interface LinkDialogProps {
  open: boolean
  initialUrl?: string
  onConfirm: (url: string) => void
  onCancel: () => void
}

const LinkDialog: React.FC<LinkDialogProps> = ({ open, initialUrl, onConfirm, onCancel }) => {
  const [url, setUrl] = useState(initialUrl || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUrl(initialUrl || '')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, initialUrl])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onConfirm(url.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onMouseDown={onCancel}>
      <div
        className="bg-white border border-gray-200 shadow-xl rounded-lg p-4 w-[380px]"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="text-sm font-medium text-gray-700 mb-3">Insert Link</div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Insert
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LinkDialog
