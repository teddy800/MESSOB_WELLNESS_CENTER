import { useEffect, useState } from 'react';
import { MessageSquare, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { feedbackService } from '../services/feedbackService';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Textarea, Select } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => !readonly && onChange?.(n)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'hover:scale-110'}`}>
          <Star size={24} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  );
}

export default function Feedback() {
  const { user, isManagerOrAbove } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: '', category: 'service' });

  const canViewAll = isManagerOrAbove();

  const load = async () => {
    setLoading(true);
    try {
      if (canViewAll) {
        const [listRes, statsRes] = await Promise.allSettled([
          feedbackService.getAll(),
          feedbackService.getStats(),
        ]);
        if (listRes.status === 'fulfilled') setFeedbackList(listRes.value.data.data || []);
        if (statsRes.status === 'fulfilled') {
          const raw = statsRes.value.data.data;
          // Normalize backend shape: { total, averageRating, ratingDistribution: [{rating, count}] }
          const dist = {};
          (raw.ratingDistribution || []).forEach(r => { dist[r.rating] = r.count; });
          setStats({
            totalFeedback: raw.total,
            averageRating: raw.averageRating,
            npsScore: raw.npsScore ?? null,
            ratingDistribution: dist,
          });
        }
      }
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feedbackService.create({
        userId: user.id,
        rating: form.rating,
        comment: form.comment || undefined,
        category: form.category,
      });
      toast.success('Thank you for your feedback!');
      setModalOpen(false);
      setForm({ rating: 5, comment: '', category: 'service' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingColor = (r) => {
    if (r >= 4) return 'success';
    if (r >= 3) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Feedback & Satisfaction</h2>
          <p className="text-sm text-slate-500 mt-0.5">Share your experience with our services</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Star size={16} /> Give Feedback
        </Button>
      </div>

      {/* Stats for managers */}
      {canViewAll && stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardBody className="text-center py-5">
              <p className="text-3xl font-bold text-amber-500">{stats.averageRating?.toFixed(1) || '—'}</p>
              <StarRating value={Math.round(stats.averageRating || 0)} readonly />
              <p className="text-sm text-slate-500 mt-1">Average Rating</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-5">
              <p className="text-3xl font-bold text-teal-600">{stats.totalFeedback || 0}</p>
              <p className="text-sm text-slate-500 mt-1">Total Responses</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-5">
              <p className="text-3xl font-bold text-purple-600">{stats.npsScore ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">NPS Score</p>
              <p className="text-xs text-slate-400 mt-0.5">Net Promoter Score</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Rating distribution */}
      {canViewAll && stats?.ratingDistribution && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-600" /> Rating Distribution
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {[5,4,3,2,1].map(r => {
                const count = stats.ratingDistribution[r] || 0;
                const pct = stats.totalFeedback ? Math.round((count / stats.totalFeedback) * 100) : 0;
                return (
                  <div key={r} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 flex-shrink-0">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-slate-700">{r}</span>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Feedback list (managers only) */}
      {canViewAll && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-slate-800">All Feedback</h3>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <MessageSquare size={36} className="mb-2 opacity-40" />
                <p className="text-sm">No feedback yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {feedbackList.map(fb => (
                  <div key={fb.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Star size={16} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating value={fb.rating} readonly />
                        <Badge variant={ratingColor(fb.rating)}>{fb.rating}/5</Badge>
                        {fb.category && <Badge variant="neutral">{fb.category}</Badge>}
                      </div>
                      {fb.comment && <p className="text-sm text-slate-700">{fb.comment}</p>}
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(fb.createdAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Submit Feedback Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Submit Feedback">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Your Rating *</p>
            <StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
          </div>
          <Select label="Category" value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            <option value="service">Service Quality</option>
            <option value="staff">Staff Behavior</option>
            <option value="facility">Facility</option>
            <option value="waiting_time">Waiting Time</option>
            <option value="overall">Overall Experience</option>
          </Select>
          <Textarea label="Comments (optional)" rows={4} value={form.comment}
            onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
            placeholder="Share your experience..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Submit Feedback</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
