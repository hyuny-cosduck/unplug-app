import { useEffect, useState } from 'react'

export type ToastMessage = {
  id: string
  message: string
  type?: 'success' | 'info' | 'warning'
}

let toastListeners: ((toast: ToastMessage) => void)[] = []

export function showToast(message: string, type: ToastMessage['type'] = 'success') {
  const toast: ToastMessage = {
    id: crypto.randomUUID(),
    message,
    type,
  }
  toastListeners.forEach((listener) => listener(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (toast: ToastMessage) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 3000)
    }
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-down ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'warning'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-800 text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
