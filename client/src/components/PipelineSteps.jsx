import { Check, Loader2, AlertTriangle, Circle } from 'lucide-react';

// The 4-step AI pipeline: Translated -> Split into parts -> Matched -> Checks.
// steps: [{ label, detail, state: 'done' | 'warn' | 'active' | 'pending' }]
export default function PipelineSteps({ steps, columns = 'sm:grid-cols-4' }) {
  return (
    <ol className={`grid gap-2 ${columns}`}>
      {steps.map((s, i) => {
        const tone = {
          done: 'border-success/40 bg-success/10',
          warn: 'border-warning/60 bg-warning/15',
          active: 'border-primary/50 bg-primary/10',
          pending: 'border-gray-200 bg-white/60 opacity-70',
        }[s.state];
        return (
          <li key={s.label} className={`relative rounded-xl border p-2.5 transition ${tone}`}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow">
                {s.state === 'done' && <Check className="h-4 w-4 text-success" />}
                {s.state === 'warn' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                {s.state === 'active' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {s.state === 'pending' && <Circle className="h-3 w-3 text-gray-400" />}
              </span>
              <span className="text-sm font-extrabold">{i + 1}. {s.label}</span>
            </div>
            {s.detail && <p className="mt-1 text-xs font-semibold text-ink/70">{s.detail}</p>}
          </li>
        );
      })}
    </ol>
  );
}
