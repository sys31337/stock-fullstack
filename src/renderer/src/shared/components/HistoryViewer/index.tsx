import React, { useState } from 'react'
import dayjs from 'dayjs'
import { t } from 'i18next'
import type { IContentHistoryEntry } from '@web/shared/types/bills'

interface HistoryViewerProps {
  history: IContentHistoryEntry[]
  onRestore?: (entry: IContentHistoryEntry) => void
}

const HistoryViewer: React.FC<HistoryViewerProps> = ({ history, onRestore }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!history || history.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        {t('noHistory') || 'No edit history available'}
      </div>
    )
  }

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime()
  )

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {t('editHistory') || 'Edit History'} ({sortedHistory.length})
      </h3>
      {sortedHistory.map((entry, index) => {
        const isExpanded = expandedIndex === index
        const user = typeof entry.editedBy === 'object' ? entry.editedBy?.username : entry.editedBy
        return (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="w-full flex items-center justify-between px-3 py-2 text-left
                bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono">#{sortedHistory.length - index}</span>
                <span className="font-medium">
                  {dayjs(entry.editedAt).format('DD/MM/YYYY HH:mm:ss')}
                </span>
                <span className="text-gray-500">
                  {t('by') || 'by'} {user || t('unknown') || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {entry.description && (
                  <span className="text-gray-400 truncate max-w-[150px]">
                    {entry.description}
                  </span>
                )}
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-gray-900 p-3 rounded border mb-3 max-h-60 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: entry.content }}
                />
                {onRestore && (
                  <button
                    type="button"
                    onClick={() => onRestore(entry)}
                    className="text-xs px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    {t('restoreVersion') || 'Restore this version'}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default HistoryViewer
