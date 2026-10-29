import { Check, Loader2, AlertTriangle, Circle } from 'lucide-react';

// The 4-step AI pipeline: Translated -> Split into parts -> Matched -> Checks.
// steps: [{ label, detail, state: 'done' | 'warn' | 'active' | 'pending' }]
export default function PipelineSteps({ steps, columns = 'sm:grid-cols-4' }) {
  return (
    <ol className={`grid gap-2 ${columns}`}>
      {steps.map((s, i) => {
        const tone = {
          done: 'border-success/30 bg-success/8',
          warn: 'border-accent/50 bg-accent/10',
          active: 'border-primary/40 bg-primary/8',
          pending: 'border-slate-200 bg-white opacity-70',
        }[s.state];
        return (
          <li key={s.label} className={`relative rounded-lg border p-2.5 transition ${tone}`}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
                {s.state === 'done' && <Check className="h-4 w-4 text-success" />}
                {s.state === 'warn' && <AlertTriangle className="h-4 w-4 text-warning" />}
                {s.state === 'active' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {s.state === 'pending' && <Circle className="h-3 w-3 text-slate-400" />}
              </span>
              <span className="text-sm font-medium">{i + 1}. {s.label}</span>
            </div>
            {s.detail && <p className="mt-1 text-xs text-mute">{s.detail}</p>}
          </li>
        );
      })}
    </ol>
  );
}
