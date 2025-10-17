"use client"

import React, { Component, ReactNode } from 'react'
import SimpleTextEditor from './SimpleTextEditor'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  height?: string
}

interface State {
  hasError: boolean
  error?: Error
}

class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return this.props.fallback || (
        <div className="editor-error-fallback">
          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-yellow-800 dark:text-yellow-200 text-sm">
            ⚠️ Rich text editor failed to load. Using simple text editor instead.
          </div>
          <SimpleTextEditor
            value={this.props.value}
            onChange={this.props.onChange}
            placeholder={this.props.placeholder}
            readOnly={this.props.readOnly}
            height={this.props.height}
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default EditorErrorBoundary
