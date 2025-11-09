'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface AlertModalProps {
  isOpen: boolean
  message: string
  type?: 'alert' | 'confirm'
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}

export default function AlertModal({
  isOpen,
  message,
  type = 'alert',
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Batal'
}: AlertModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={type === 'alert' ? onConfirm : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">
                {type === 'confirm' ? '⚠️' : 'ℹ️'}
              </div>
              <h3 className="text-2xl font-black text-white mb-4">
                {type === 'confirm' ? 'Konfirmasi' : 'Pemberitahuan'}
              </h3>
              <div className="bg-slate-700/50 border border-slate-600 rounded-2xl p-6 mb-6">
                <div className="text-slate-200 text-lg whitespace-pre-line">
                  {message}
                </div>
              </div>
              <div className="flex gap-3">
                {type === 'confirm' && (
                  <button
                    className="button flex-1 bg-slate-600 hover:bg-slate-700 text-lg py-3"
                    onClick={onCancel}
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  className={`button flex-1 text-lg py-3 ${
                    type === 'confirm'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-sky-600 hover:bg-sky-700'
                  }`}
                  onClick={onConfirm}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

