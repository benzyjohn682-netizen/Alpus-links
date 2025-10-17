"use client"

import { useState, useRef } from 'react'

interface SimpleTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  height?: string
}

export default function SimpleTextEditor({
  value,
  onChange,
  placeholder = "Start writing your content here...",
  readOnly = false,
  height = "400px"
}: SimpleTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle basic formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          insertFormatting('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertFormatting('*', '*')
          break
        case 'u':
          e.preventDefault()
          insertFormatting('<u>', '</u>')
          break
        case 'Enter':
          e.preventDefault()
          insertText('\n\n')
          break
      }
    }
  }

  const insertFormatting = (before: string, after: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const insertText = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = value.substring(0, start) + text + value.substring(end)
    
    onChange(newText)
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  return (
    <div className="simple-text-editor">
      <div className="toolbar mb-2 flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-t-md border border-gray-300 dark:border-gray-600 border-b-0">
        <button
          type="button"
          onClick={() => insertFormatting('**', '**')}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('*', '*')}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('<u>', '</u>')}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => insertText('\n\n')}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="New Paragraph (Ctrl+Enter)"
        >
          ¶
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('- ', '')}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('1. ', '')}
          className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Numbered List"
        >
          1.
        </button>
      </div>
      
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-b-md resize-vertical bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors ${
          isFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
        }`}
        style={{ 
          minHeight: height,
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.6'
        }}
      />
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <strong>Shortcuts:</strong> Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline), Ctrl+Enter (New Paragraph)
      </div>
    </div>
  )
}
