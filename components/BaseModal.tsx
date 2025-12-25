'use client'

import { createPortal } from 'react-dom'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  onClose: () => void
  children: ReactNode
}

export const BaseModal = ({ onClose, children }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 200)
  }, [onClose])

  // ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  // click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [close])

  return createPortal(
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/50 transition-opacity duration-200
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        ref={ref}
        className={`
          w-full max-w-md rounded bg-white p-6 relative
          transition-all duration-200
          ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 text-gray-500 cursor-pointer"
        >
          ✕
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}
