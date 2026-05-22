import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Store, Search, Package, AlertCircle, Plus, Filter } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { formatKES, cn } from '../../lib/utils'
import type { Product } from '../../types'

const CATEGORIES = ['all', 'antibiotic', 'analgesic', 'vitamin', 'antimalaria', 'antifungal', 'antihistamine', 'other']

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  antibiotic:     { bg: '#FEE2E2', text: '#991B1B' },
  analgesic:      { bg: '#DBEAFE', text: '#1E40AF' },
  vitamin:        { bg: '#D1FAE5', text: '#065F46' },
  antimalaria:    { bg: '#FEF3C7', text: '#92400E' },
  antifungal:     { bg: '#EDE9FE', text: '#5B21B6' },
  antihistamine:  { bg: '#FCE7F3', text: '#9D174D' },
  other:          { bg: '#F3F4F6', text: '#374151' },
}

function StockBar({ qty, max = 100 }: { qty: number; max?: number }) {
  const pct = Math.min(100, (qty / max) * 100)
  const color = pct > 50 ? '#059669' : pct > 20 ? '#D97706' : '#DC2626'
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const catStyle = CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.other
  const isLowStock = product.stock_quantity < 20
  const isOutOfStock = product.stock_quantity === 0

  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: catStyle.bg }}
        >
          <Package className="h-5 w-5" style={{ color: catStyle.text }} />
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
          style={catStyle}
        >
          {product.category}
        </span>
      </div>

      {/* Name & description */}
      <div>
        <p className="text-sm font-bold text-gray-900 leading-snug">{product.name}</p>
        {product.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>
        )}
      </div>

      {/* Price */}
      <p className="text-base font-extrabold" style={{ color: '#1E40AF' }}>
        {formatKES(product.price_kes)}
      </p>

      {/* Stock */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Stock</span>
          <span
            className={cn(
              'text-xs font-bold',
              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-green-700',
            )}
          >
            {isOutOfStock ? 'Out of stock' : `${product.stock_quantity} units`}
          </span>
        </div>
        <StockBar qty={product.stock_quantity} max={100} />
      </div>

      {/* Flags */}
      <div className="flex items-center gap-2">
        {product.requires_prescription && (
          <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
            Rx Required
          </span>
        )}
        <span
          className={cn(
            'px-2 py-0.5 rounded-md text-[10px] font-bold',
            product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500',
          )}
        >
          {product.is_active ? 'Listed' : 'Unlisted'}
        </span>
      </div>
    </div>
  )
}

export function ClinicProductsPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const { data: allProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['clinic-products'],
    queryFn: () => api.get('/orders/products').then(r => r.data),
    staleTime: 120_000,
  })

  const products = allProducts.filter(p =>
    !user?.clinic_id || p.clinic_id === user.clinic_id,
  )

  const filtered = products.filter(p => {
    const matchCat = category === 'all' || p.category === category
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const totalValue = products.reduce((sum, p) => sum + p.price_kes * p.stock_quantity, 0)
  const lowStockCount = products.filter(p => p.stock_quantity < 20 && p.stock_quantity > 0).length
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {products.length} products · {formatKES(totalValue)} inventory value
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm opacity-60 cursor-not-allowed"
          style={{ backgroundColor: '#1E40AF' }}
          title="Coming soon"
          disabled
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Products', val: products.length, color: '#1E40AF', bg: '#EFF6FF' },
          { label: 'Low Stock', val: lowStockCount, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Out of Stock', val: outOfStockCount, color: '#DC2626', bg: '#FEF2F2' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ backgroundColor: s.bg, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-56 rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all capitalize',
                category === cat
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
              style={category === cat ? { backgroundColor: '#1E40AF' } : {}}
            >
              {cat === 'all' ? 'All categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="flex flex-col items-center py-16 text-center bg-white rounded-2xl"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <Store className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600">
            {search || category !== 'all' ? 'No matching products' : 'No products listed'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {search || category !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Add products to enable medicine ordering for your patients.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Product management</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Full product CRUD (add, edit, restock, deactivate) is launching next sprint. Contact support to update your product catalog.
          </p>
        </div>
      </div>
    </div>
  )
}
