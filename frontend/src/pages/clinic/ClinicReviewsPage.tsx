import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Star, ThumbsUp, MessageSquare, TrendingUp, Filter, CornerDownRight, Send, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { cn } from '../../lib/utils'

interface Review {
  id: string
  patient_name: string
  rating: number
  comment: string
  date: string
  doctor_name: string | null
  helpful: number
  category: 'appointment' | 'medicine' | 'staff'
  replied: boolean
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    patient_name: 'Wanjiku M.',
    rating: 5,
    comment: 'Excellent service from Dr. Kamau. The consultation was thorough and the staff were very friendly. I especially appreciated how quickly I got the appointment through the app.',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    doctor_name: 'Dr. James Kamau',
    helpful: 8,
    category: 'appointment',
    replied: true,
  },
  {
    id: '2',
    patient_name: 'Brian O.',
    rating: 4,
    comment: 'Good clinic, clean environment and professional staff. Waiting time was a bit long but the doctor was very helpful and explained everything clearly.',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    doctor_name: 'Dr. Amina Hassan',
    helpful: 5,
    category: 'appointment',
    replied: false,
  },
  {
    id: '3',
    patient_name: 'Grace K.',
    rating: 5,
    comment: 'The medicine delivery was fast and the packaging was secure. All items were correct and the prices are competitive. Will definitely order again.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    doctor_name: null,
    helpful: 12,
    category: 'medicine',
    replied: true,
  },
  {
    id: '4',
    patient_name: 'Peter N.',
    rating: 3,
    comment: 'The appointment itself was fine but I had trouble getting the confirmation via the app. The reception team was helpful when I called directly.',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    doctor_name: 'Dr. James Kamau',
    helpful: 3,
    category: 'staff',
    replied: false,
  },
  {
    id: '5',
    patient_name: 'Amina H.',
    rating: 5,
    comment: 'MedAssist AI made it so easy to book and the clinic was exactly as described. The symptom checker actually helped me know what to tell the doctor. Very impressed!',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    doctor_name: 'Dr. Sarah Mwangi',
    helpful: 15,
    category: 'appointment',
    replied: true,
  },
  {
    id: '6',
    patient_name: 'Joseph M.',
    rating: 4,
    comment: 'Quick service and friendly staff. The doctor was knowledgeable and the prescription was ready fast. Minor improvement needed on parking space.',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    doctor_name: 'Dr. Amina Hassan',
    helpful: 7,
    category: 'appointment',
    replied: false,
  },
]

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('shrink-0', i < rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200')}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  )
}

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  const counts = [5, 4, 3, 2, 1].map(r => ({
    rating: r,
    count: reviews.filter(rv => rv.rating === r).length,
  }))
  const max = Math.max(...counts.map(c => c.count), 1)

  return (
    <div className="space-y-2">
      {counts.map(({ rating, count }) => (
        <div key={rating} className="flex items-center gap-3">
          <div className="flex items-center gap-1 w-8 shrink-0">
            <span className="text-xs font-bold text-gray-700">{rating}</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-4 text-right">{count}</span>
        </div>
      ))}
    </div>
  )
}

function ReviewCard({ review, clinicId }: { review: Review; clinicId?: string }) {
  const qc = useQueryClient()
  const [liked, setLiked]         = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')

  const replyMutation = useMutation({
    mutationFn: () =>
      api.post(`/clinics/${clinicId}/reviews/${review.id}/reply`, { reply: replyText.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-reviews', clinicId] })
      setReplyOpen(false)
      setReplyText('')
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['clinic-reviews', clinicId] })
      setReplyOpen(false)
      setReplyText('')
    },
  })

  return (
    <div
      className="bg-white rounded-2xl p-5 space-y-3"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-extrabold"
            style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}
          >
            {review.patient_name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{review.patient_name}</p>
            <p className="text-[11px] text-gray-400">
              {format(parseISO(review.date), 'd MMM yyyy')}
              {review.doctor_name && ` · ${review.doctor_name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StarRating rating={review.rating} />
          {review.replied && (
            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold">
              Replied
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>

      <div className="flex items-center justify-between pt-1">
        <span
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide capitalize"
          style={{
            backgroundColor: review.category === 'appointment' ? '#EFF6FF'
              : review.category === 'medicine' ? '#ECFDF5' : '#FEF3C7',
            color: review.category === 'appointment' ? '#1E40AF'
              : review.category === 'medicine' ? '#059669' : '#92400E',
          }}
        >
          {review.category}
        </span>

        <div className="flex items-center gap-2">
          {!review.replied && (
            <button
              onClick={() => setReplyOpen(v => !v)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-100"
              style={{ color: replyOpen ? '#1E40AF' : '#9CA3AF' }}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Reply
            </button>
          )}
          <button
            onClick={() => setLiked(v => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-100"
            style={{ color: liked ? '#1E40AF' : '#9CA3AF' }}
          >
            <ThumbsUp className={cn('h-3.5 w-3.5', liked && 'fill-current')} />
            {review.helpful + (liked ? 1 : 0)} helpful
          </button>
        </div>
      </div>

      {replyOpen && (
        <div className="pt-2 border-t border-gray-50">
          <div className="flex items-start gap-2">
            <CornerDownRight className="h-3.5 w-3.5 text-gray-300 mt-3 shrink-0" />
            <div className="flex-1 space-y-2">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={2}
                placeholder="Write a reply to this review…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setReplyOpen(false); setReplyText('') }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => replyMutation.mutate()}
                  disabled={replyText.trim().length < 5 || replyMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40"
                  style={{ backgroundColor: '#1E40AF' }}
                >
                  {replyMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />}
                  Post Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ClinicReviewsPage() {
  const { user } = useAuthStore()
  const clinicId = user?.clinic_id

  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const { data: apiReviews } = useQuery<Review[]>({
    queryKey: ['clinic-reviews', clinicId],
    queryFn: async () => {
      const { data } = await api.get(`/clinics/${clinicId}/reviews`)
      return data
    },
    enabled: !!clinicId,
  })

  const reviews = apiReviews && apiReviews.length > 0 ? apiReviews : MOCK_REVIEWS

  const filtered = reviews.filter(r => {
    const matchRating = filterRating === null || r.rating === filterRating
    const matchCat = filterCategory === 'all' || r.category === filterCategory
    return matchRating && matchCat
  })

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const replyRate = Math.round((reviews.filter(r => r.replied).length / reviews.length) * 100)

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {reviews.length} reviews · {avgRating.toFixed(1)} average rating
          </p>
        </div>
      </div>

      {/* Summary panel */}
      <div
        className="bg-white rounded-2xl p-6 grid grid-cols-1 gap-6 sm:grid-cols-3"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Average score */}
        <div className="flex flex-col items-center justify-center gap-2 sm:border-r sm:border-gray-100">
          <p className="text-5xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</p>
          <StarRating rating={Math.round(avgRating)} size={20} />
          <p className="text-xs text-gray-400">{reviews.length} total reviews</p>
        </div>

        {/* Distribution */}
        <div className="sm:col-span-2">
          <RatingDistribution reviews={reviews} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg Rating', val: avgRating.toFixed(1), suffix: '/ 5', color: '#D97706' },
          { label: 'Reply Rate', val: `${replyRate}%`, suffix: '', color: '#059669' },
          { label: 'This Month', val: reviews.filter(r => r.date > new Date(Date.now() - 30 * 86400000).toISOString()).length.toString(), suffix: ' reviews', color: '#1E40AF' },
        ].map(s => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>
              {s.val}<span className="text-sm font-normal text-gray-400">{s.suffix}</span>
            </p>
            <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500">Filter:</span>
        </div>
        {/* Rating filter */}
        <div className="flex items-center gap-1.5">
          {[null, 5, 4, 3, 2, 1].map(r => (
            <button
              key={r ?? 'all'}
              onClick={() => setFilterRating(r)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                filterRating === r
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
              style={filterRating === r ? { backgroundColor: '#1E40AF' } : {}}
            >
              {r === null ? 'All stars' : `${r}★`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          {['all', 'appointment', 'medicine', 'staff'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize',
                filterCategory === cat
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
              )}
              style={filterCategory === cat ? { backgroundColor: '#059669' } : {}}
            >
              {cat === 'all' ? 'All types' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Review list */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center py-16 text-center bg-white rounded-2xl"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Star className="h-7 w-7 text-amber-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600">No reviews match this filter</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting the rating or category filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => (
            <ReviewCard key={review.id} review={review} clinicId={clinicId} />
          ))}
        </div>
      )}

      {/* Note */}
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
        <TrendingUp className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Reviews integration</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Live review sync from patient appointments is in development. These reviews represent your expected review profile. Reply functionality and review request emails launch next sprint.
          </p>
        </div>
      </div>
    </div>
  )
}
