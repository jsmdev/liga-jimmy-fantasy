import React from 'react'
import Button from './Button.jsx'

export default function Modal({ open, title, description, children, onClose, footer }) {
  if (!open) return null
  return (
    <div className="modal-backdrop">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg w-full max-w-xl">
        <div className="px-6 pt-6">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-700 mt-1">{description}</p>}
        </div>
        <div className="px-6 py-4">{children}</div>
        <div className="px-6 pb-6 flex gap-2 justify-end">{footer || <Button variant="secondary" onClick={onClose}>Cerrar</Button>}</div>
      </div>
    </div>
  )
}
