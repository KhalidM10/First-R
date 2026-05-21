import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import type { CartItem } from '../types'

interface CartDrawerProps {
  isOpen: boolean
  items: CartItem[]
  onClose: () => void
  onUpdateQty: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onCheckout: () => void
}

const DELIVERY_FEE = 200

export function CartDrawer({ isOpen, items, onClose, onUpdateQty, onRemove, onCheckout }: CartDrawerProps) {
  const subtotal = items.reduce((sum, i) => sum + i.priceKes * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f1f0ec' }}>
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-gray-700" />
            <span className="font-bold text-gray-900 text-[15px]">Your Cart</span>
            {itemCount > 0 && (
              <span
                className="text-[11px] font-bold rounded-full px-2 py-0.5"
                style={{ backgroundColor: '#1E40AF', color: 'white' }}
              >
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <ShoppingBag className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-start gap-3">
                  {/* Color indicator */}
                  <div
                    className="mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: '#1E40AF' }}
                  >
                    {item.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 leading-tight">{item.name}</p>
                    {item.clinicName && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.clinicName}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      {/* Qty controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateQty(item.productId, -1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center border text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                          style={{ borderColor: '#e5e2dc' }}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-[13px] font-bold text-gray-900 w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(item.productId, 1)}
                          className="h-6 w-6 rounded-lg flex items-center justify-center border text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                          style={{ borderColor: '#e5e2dc' }}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[13px] font-bold text-gray-900">
                        KES {(item.priceKes * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(item.productId)}
                    className="mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-5 space-y-4" style={{ borderTop: '1px solid #f1f0ec' }}>
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Delivery fee (if applicable)</span>
                <span>+KES {DELIVERY_FEE.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#1E40AF' }}
            >
              Proceed to Checkout — KES {subtotal.toLocaleString()}
            </button>

            <p className="text-[10px] text-center text-gray-400">
              OTC products only — no prescription medicines
            </p>
          </div>
        )}
      </div>
    </>
  )
}
