import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Image as ImageExtension } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Link } from '@tiptap/extension-link'
import { t } from 'i18next'

interface WysiwygEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
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
    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm leading-none
      ${active ? 'bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
    `}
  >
    {children}
  </button>
)

const Divider = () => (
  <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
)

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
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
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: placeholder || t('startTyping') || 'Start typing...',
      }),
    ],
    content: content || '',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none p-4',
      },
    },
  })

  if (!editor) return null

  const addImage = () => {
    const url = window.prompt(t('imageUrl') || 'Image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 4, withHeaderRow: true }).run()
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-px px-2 py-1.5 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 print:hidden">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title={t('bold') || 'Bold'}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title={t('italic') || 'Italic'}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title={t('underline') || 'Underline'}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title={t('strike') || 'Strikethrough'}
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title={t('heading1') || 'Heading 1'}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title={t('heading2') || 'Heading 2'}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title={t('heading3') || 'Heading 3'}
        >
          H3
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title={t('bulletList') || 'Bullet list'}
        >
          &#8226;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title={t('orderedList') || 'Ordered list'}
        >
          1.
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          &ldquo;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code block"
        >
          &lt;/&gt;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          &mdash;
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title={t('alignLeft') || 'Align left'}
        >
          &#x2190;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title={t('alignCenter') || 'Center'}
        >
          &#x2194;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title={t('alignRight') || 'Align right'}
        >
          &#x2192;
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleLink({ href: '' }).run()}
          active={editor.isActive('link')}
          title="Link"
        >
          &#x1F517;
        </ToolbarButton>
        <ToolbarButton onClick={insertTable} title={t('insertTable') || 'Insert table'}>
          &#x25A6;
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title={t('image') || 'Image'}>
          &#x1F5BC;
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title={t('undo') || 'Undo'}
        >
          &#x21B6;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title={t('redo') || 'Redo'}
        >
          &#x21B7;
        </ToolbarButton>
      </div>

      <div className="min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default WysiwygEditor
