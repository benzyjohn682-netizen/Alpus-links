"use client"

import { useMemo, useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import SimpleTextEditor from './SimpleTextEditor'
import EditorErrorBoundary from './EditorErrorBoundary'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  height?: string
}

// Improved dynamic import with error handling
const ReactQuill = dynamic(
  () => import('react-quill').catch((error) => {
    console.error('Failed to load react-quill:', error)
    // Return a fallback component
    return {
      default: ({ value, onChange, placeholder, readOnly, ...props }: any) => (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="w-full p-3 border border-gray-300 rounded-md min-h-[200px] resize-vertical"
          {...props}
        />
      )
    }
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full p-3 border border-gray-300 rounded-md min-h-[200px] flex items-center justify-center text-gray-500">
        Loading editor...
      </div>
    )
  }
)

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing your content here...",
  readOnly = false,
  height = "400px"
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    // Set loaded state after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // No JS needed for dropdown toggle; handled by Quill via .ql-expanded / aria-expanded

  

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  }), [])

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'direction',
    'code-block'
  ]

  const handleChange = (content: string) => {
    onChange(content)
  }


  return (
    <EditorErrorBoundary
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      height={height}
    >
      <div className="rich-text-editor">
        <style>{`
        .rich-text-editor .ql-toolbar {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 1px solid #dee2e6;
          border-bottom: none;
          border-radius: 12px 12px 0 0;
          padding: 12px 16px;
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 4px;
          min-height: 56px;
          box-sizing: border-box;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .rich-text-editor .ql-container {
          border: 1px solid #dee2e6;
          border-top: none;
          border-radius: 0 0 12px 12px;
          font-family: inherit;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .rich-text-editor .ql-editor {
          min-height: ${height};
          font-size: 14px;
          line-height: 1.6;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #6c757d;
          font-style: normal;
        }
        
        .rich-text-editor .ql-toolbar .ql-formats {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-right: 4px;
          flex-shrink: 0;
        }
        
        .rich-text-editor .ql-toolbar button {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .rich-text-editor .ql-toolbar button:hover {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-color: #90caf9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
        }
        
        
        .rich-text-editor .ql-toolbar button.ql-active {
          background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
          color: white;
          border-color: #1565c0;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
          transform: translateY(-1px);
        }
        
        /* Color picker buttons inherit from main button styles */
        
        .rich-text-editor .ql-toolbar .ql-picker {
          height: 32px;
          min-width: 60px;
        }
        
        /* Color picker specific positioning - only when expanded */
        .rich-text-editor .ql-toolbar .ql-color.ql-expanded .ql-picker-options,
        .rich-text-editor .ql-toolbar .ql-background.ql-expanded .ql-picker-options,
        .rich-text-editor .ql-toolbar .ql-color .ql-picker-label[aria-expanded="true"] + .ql-picker-options,
        .rich-text-editor .ql-toolbar .ql-background .ql-picker-label[aria-expanded="true"] + .ql-picker-options {
          z-index: 99999 !important;
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          display: flex !important;
          flex-wrap: wrap !important;
          width: 280px !important;
          padding: 12px !important;
          gap: 6px !important;
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1) !important;
          margin-top: 6px !important;
        }
        
        /* Dark mode for color pickers */
        .dark .rich-text-editor .ql-toolbar .ql-color.ql-expanded .ql-picker-options,
        .dark .rich-text-editor .ql-toolbar .ql-background.ql-expanded .ql-picker-options,
        .dark .rich-text-editor .ql-toolbar .ql-color .ql-picker-label[aria-expanded="true"] + .ql-picker-options,
        .dark .rich-text-editor .ql-toolbar .ql-background .ql-picker-label[aria-expanded="true"] + .ql-picker-options {
          background: #2d3748 !important;
          border-color: #4a5568 !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3) !important;
        }
        
        .rich-text-editor .ql-toolbar .ql-color .ql-picker-item,
        .rich-text-editor .ql-toolbar .ql-background .ql-picker-item {
          width: 24px !important;
          height: 24px !important;
          border-radius: 4px !important;
          border: 1px solid #d1d5db !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          flex-shrink: 0 !important;
        }
        
        .rich-text-editor .ql-toolbar .ql-color .ql-picker-item:hover,
        .rich-text-editor .ql-toolbar .ql-background .ql-picker-item:hover {
          transform: scale(1.15) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25) !important;
          border-color: #9ca3af !important;
          z-index: 1 !important;
        }
        
        .rich-text-editor .ql-toolbar .ql-color .ql-picker-item.ql-selected,
        .rich-text-editor .ql-toolbar .ql-background .ql-picker-item.ql-selected {
          border: 2px solid #007bff !important;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
        }
        
        /* Default: hide dropdowns */
        .rich-text-editor .ql-toolbar .ql-picker .ql-picker-options {
          display: none !important;
        }

        /* Show when expanded (Quill toggles these states) */
        .rich-text-editor .ql-toolbar .ql-picker.ql-expanded .ql-picker-options,
        .rich-text-editor .ql-toolbar .ql-picker .ql-picker-label[aria-expanded="true"] + .ql-picker-options {
          display: block !important;
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 99999;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin-top: 4px;
          min-width: 140px;
        }
        
        /* Dark mode for dropdowns */
        .dark .rich-text-editor .ql-toolbar .ql-picker.ql-expanded .ql-picker-options,
        .dark .rich-text-editor .ql-toolbar .ql-picker .ql-picker-label[aria-expanded="true"] + .ql-picker-options {
          background: #2d3748;
          border-color: #4a5568;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
        }
        
        /* Ensure dropdown containers don't clip content */
        .rich-text-editor .ql-toolbar .ql-picker,
        .rich-text-editor .ql-toolbar { overflow: visible; }
        
        
        
        .rich-text-editor .ql-toolbar .ql-picker-label {
          border-radius: 6px;
          padding: 6px 8px;
          color: #495057;
          font-weight: 500;
          font-size: 12px;
          background: white;
          border: none;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 50px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-label:hover {
          background: #e9ecef;
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-options {
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          background: white;
          padding: 4px 0;
          margin-top: 4px;
          z-index: 99999 !important;
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          min-width: 200px;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-item {
          padding: 8px 12px;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-item:hover {
          background: #f8f9fa;
          color: #1f2937;
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-item.ql-selected {
          background: #007bff;
          color: white;
        }
        
        /* Dark mode for picker items */
        .dark .rich-text-editor .ql-toolbar .ql-picker-item {
          color: #e2e8f0;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-item:hover {
          background: #4a5568;
          color: #f7fafc;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-item.ql-selected {
          background: #007bff;
          color: white;
        }
        
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #495057;
          stroke-width: 1.5;
        }
        
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #495057;
        }
        
        /* Ensure icons fit properly */
        .rich-text-editor .ql-toolbar button svg {
          width: 16px;
          height: 16px;
          max-width: 100%;
          max-height: 100%;
        }
        
        /* Fix for color picker icons */
        .rich-text-editor .ql-toolbar .ql-color .ql-picker-label svg,
        .rich-text-editor .ql-toolbar .ql-background .ql-picker-label svg {
          width: 18px;
          height: 18px;
          max-width: 100%;
          max-height: 100%;
        }
        
        /* Button group spacing */
        .rich-text-editor .ql-toolbar .ql-color,
        .rich-text-editor .ql-toolbar .ql-background,
        .rich-text-editor .ql-toolbar .ql-list,
        .rich-text-editor .ql-toolbar .ql-indent {
          margin: 0 4px;
          position: relative;
        }
        
        /* Alignment buttons inherit from main button styles */
        
        /* Dark mode styles */
        .dark .rich-text-editor .ql-toolbar {
          background: #2d3748;
          border-color: #4a5568;
        }
        
        .dark .rich-text-editor .ql-container {
          border-color: #4a5568;
          background: #1a202c;
        }
        
        .dark .rich-text-editor .ql-editor {
          color: #e2e8f0;
        }
        
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: #718096;
        }
        
        .dark .rich-text-editor .ql-toolbar button {
          background: #1a202c;
          border-color: #4a5568;
          color: #e2e8f0;
        }
        
        .dark .rich-text-editor .ql-toolbar button:hover {
          background: #4a5568;
          border-color: #718096;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #e2e8f0;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-fill {
          fill: #e2e8f0;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker {
          background: #1a202c;
          border-color: #4a5568;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-label {
          color: #e2e8f0;
          background: #1a202c;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-label:hover {
          background: #4a5568;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-options {
          background: #2d3748;
          border-color: #4a5568;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-item {
          color: #e2e8f0;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-item:hover {
          background: #4a5568;
          color: #f7fafc;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-item.ql-selected {
          background: #007bff;
          color: white;
        }
      `}</style>
      
      {loadError ? (
        <SimpleTextEditor
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readOnly}
          height={height}
        />
      ) : (
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{ height: 'auto' }}
        />
      )}
      </div>
    </EditorErrorBoundary>
  )
}
