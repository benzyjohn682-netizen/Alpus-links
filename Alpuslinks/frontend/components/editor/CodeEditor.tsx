"use client"

import { Editor } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  height?: string
  placeholder?: string
  readOnly?: boolean
}

export default function CodeEditor({
  value,
  onChange,
  language = 'html',
  height = '400px',
  placeholder = 'Start typing your code here...',
  readOnly = false
}: CodeEditorProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600" style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          Loading editor...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          guides: {
            indentation: true,
            bracketPairs: true
          },
          suggest: {
            showKeywords: true,
            showSnippets: true
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          parameterHints: { enabled: true },
          hover: { enabled: true },
          contextmenu: true,
          mouseWheelZoom: true,
          smoothScrolling: true,
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on',
          fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace",
          fontLigatures: true
        }}
        loading={
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
      />
    </div>
  )
}
