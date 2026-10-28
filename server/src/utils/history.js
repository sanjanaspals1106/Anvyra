import { Project, Task, Update } from '../models/index.js';
import { getPlannedPercent } from './progress.js';

const WEEK = 7 * 24 * 60 * 60 * 1000;

// Weekly points from project start to today: cumulative actual % (approved updates only)
// and the planned % on the same date. Used by the officer's line chart.
export async function getProgressHistory(now = new Date()) {
  const projects = await Project.find().sort('createdAt').lean();
  const result = [];
  for (const p of projects) {
    const [tasks, updates] = await Promise.all([
      Task.find({ projectId: p._id }).lean(),
      Update.find({ projectId: p._id, status: 'approved' }).select('workDate items').lean(),
    ]);
    const start = new Date(p.startDate).getTime();
    const points = [];
    const dates = [];
    for (let t = start; t < now.getTime(); t += WEEK) dates.push(new Date(t));
    dates.push(now); // always end exactly at today
    for (const date of dates) {
      const done = {};
      for (const u of updates) {
        if (new Date(u.workDate) > date) continue;
        for (const it of u.items) {
          if (it.kind === 'task') done[it.taskId] = (done[it.taskId] || 0) + it.quantity;
        }
      }
      const avg = tasks.length
        ? tasks.reduce((s, t) => s + (t.plannedQty > 0 ? Math.min(100, ((done[t._id] || 0) / t.plannedQty) * 100) : 0), 0) / tasks.length
        : 0;
      points.push({
        date: date.toISOString().slice(0, 10),
        actual: Math.round(avg * 10) / 10,
        planned: getPlannedPercent(p, date),
      });
    }
    result.push({ projectId: p._id, name: p.name, type: p.type, points });
  }
  return result;
}
