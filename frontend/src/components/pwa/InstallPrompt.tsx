import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const VISIT_KEY   = 'ma_visit_count'
const DISMISS_KEY = 'ma_install_dismissed'
const SHOW_AFTER  = 3

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Increment visit counter
    const count = parseInt(localStorage.getItem(VISIT_KEY) ?? '0', 10) + 1
    localStorage.setItem(VISIT_KEY, String(count))

    const dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    if (dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (count >= SHOW_AFTER) setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50
                 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-start gap-3
                 animate-slide-up"
      role="dialog"
      aria-label="Install MedAssist AI"
    >
      <div
        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0d1f10, #0c1a2e)' }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11"
            stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">Install MedAssist AI</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          Add to your home screen for faster access and offline support.
        </p>
        <button
          onClick={install}
          className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Install app
        </button>
      </div>

      <button
        onClick={dismiss}
        className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
