"use client"
import { useEffect, useRef, useState } from 'react'

interface DefaultAvatarProps {
  className?: string
  alt?: string
  name?: string
  backgroundColor?: string
  textColor?: string
}

export function DefaultAvatar({ 
  className = "w-8 h-8", 
  alt = "Default Avatar",
  name = '',
  backgroundColor = '#1D4ED8',
  textColor = '#FFFFFF'
}: DefaultAvatarProps) {
  const initial = (name || alt || '?').trim().charAt(0).toUpperCase() || '?'
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [fontSizePx, setFontSizePx] = useState<number>(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const size = Math.min(el.clientWidth || 0, el.clientHeight || 0)
      // Scale letter relative to circle size: 62% looks balanced across sizes
      setFontSizePx(size ? Math.round(size * 0.62) : 0)
    }

    update()

    // Observe size changes to keep text proportional
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`${className} rounded-full overflow-hidden flex items-center justify-center select-none`} 
      aria-label={alt}
      style={{ backgroundColor, lineHeight: 1 }}
      title={name || alt}
    >
      <span className="font-semibold leading-none" style={{ color: textColor, fontSize: fontSizePx ? `${fontSizePx}px` : undefined }}>
        {initial}
      </span>
    </div>
  )
}
