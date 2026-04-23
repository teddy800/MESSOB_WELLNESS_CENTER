import { useEffect, useState } from 'react';
import { Heart, Plus, CheckCircle, Dumbbell, Apple, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { wellnessService } from '../services/wellnessService';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Textarea, Select } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const templates = [
  {
    icon: Apple, color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    title: 'Nutrition Plan',
    text: 'Balanced diet with reduced sodium and sugar intake. Include 5 servings of fruits and vegetables daily. Limit processed foods and increase whole grains. Stay hydrated with 8+ glasses of water per day.',
    goals: 'Reduce BMI by 2 points in 3 months. Maintain blood sugar below 100 mg/dL.',
  },
  {
    icon: Dumbbell, color: 'bg-blue-50 text-blue-600 border-blue-100',
    title: 'Exercise Plan',
    text: '30 minutes of moderate aerobic exercise 5 days per week. Include strength training 2 days per week. Start with walking and gradually increase intensity. Incorporate stretching and flexibility exercises.',
    goals: 'Complete 150 minutes of exercise per week. Improve cardiovascular endurance.',
  },
  {
    icon: Brain, color: 'bg-purple-50 text-purple-600 border-purple-100',
    title: 'Stress Management',
    text: 'Practice mindfulness meditation for 10 minutes daily. Maintain a regular sleep schedule of 7-8 hours. Engage in relaxation techniques such as deep breathing. Limit screen time before bed.',
    goals: 'Reduce stress indicators. Improve sleep quality and duration.',
  },
];

export default function Wellness() {
  const { user, isNurseOrAbove } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ userId: '', planText: '', goals: '', duration: '' });

  const canCreate = isNurseOrAbove();

  const load = async () => {
    setLoading(true);
    try {
      const res = await wellnessService.getByUser(user.id);
      setPlans(res.data.data || []);
    } catch {
      toast.error('Failed to load wellness plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const applyTemplate = (tpl) => {
    setForm(f => ({ ...f, planText: tpl.text, goals: tpl.goals }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.planText) { toast.error('Plan text is required'); return; }
    setSubmitting(true);
    try {
      await wellnessService.create({
        userId: form.userId || user.id,
        planText: form.planText,
        goals: form.goals || undefined,
        duration: form.duration ? parseInt(form.duration) : undefined,
      });
      toast.success('Wellness plan created');
      setModalOpen(false);
      setForm({ userId: '', planText: '', goals: '', duration: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Wellness Plans</h2>
          <p className="text-sm text-slate-500 mt-0.5">Personalized preventive health management</p>
        </div>
        {canCreate && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Create Plan
          </Button>
        )}
      </div>

      {/* Template cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {templates.map(tpl => {
          const Icon = tpl.icon;
          return (
            <div key={tpl.title} className={`p-4 rounded-2xl border ${tpl.color} flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <Icon size={18} />
                <span className="font-bold text-sm">{tpl.title}</span>
              </div>
              <p className="text-xs opacity-80 line-clamp-3">{tpl.text}</p>
              {canCreate && (
                <button onClick={() => { applyTemplate(tpl); setModalOpen(true); }}
                  className="mt-auto text-xs font-semibold underline opacity-70 hover:opacity-100 text-left">
                  Use this template →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Plans list */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800">My Wellness Plans</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400">
              <Heart size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No wellness plans yet</p>
              {canCreate && <p className="text-xs mt-1">Create a personalized plan above</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map(plan => (
                <div key={plan.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-slate-500">
                        Created {format(new Date(plan.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{plan.planText}</p>
                  {plan.goals && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-1">Goals</p>
                      <p className="text-xs text-slate-600">{plan.goals}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Wellness Plan" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {canCreate && (
            <Input label="Patient User ID (leave blank for self)" value={form.userId}
              onChange={set('userId')} placeholder="UUID of patient" />
          )}
          <div className="mb-2">
            <p className="text-sm font-semibold text-slate-700 mb-2">Quick Templates</p>
            <div className="flex gap-2 flex-wrap">
              {templates.map(tpl => (
                <button key={tpl.title} type="button" onClick={() => applyTemplate(tpl)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-xs font-semibold text-slate-600 border border-slate-200 hover:border-teal-200 transition-colors">
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Plan Details *" required rows={5} value={form.planText} onChange={set('planText')}
            placeholder="Describe the wellness plan in detail..." />
          <Textarea label="Goals" rows={3} value={form.goals} onChange={set('goals')}
            placeholder="Measurable goals for this plan..." />
          <Input label="Duration (days)" type="number" value={form.duration} onChange={set('duration')} placeholder="e.g. 90" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={submitting}>Create Plan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
