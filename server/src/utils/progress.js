import mongoose from 'mongoose';
import { Project, Task, Material, Update, MaterialReceipt, Expense, Issue } from '../models/index.js';

// All progress, stock and budget numbers are calculated from approved data.
// Nothing here is stored, so the numbers can never go out of sync.

const toId = (id) => (typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id);
const round1 = (n) => Math.round(n * 10) / 10;

// Approved quantity per task, e.g. { "<taskId>": 12 }
async function approvedQtyByTask(projectId) {
  const rows = await Update.aggregate([
    { $match: { projectId: toId(projectId), status: 'approved' } },
    { $unwind: '$items' },
    { $match: { 'items.kind': 'task' } },
    { $group: { _id: '$items.taskId', done: { $sum: '$items.quantity' } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.done]));
}

// Progress of every task, plus the project's overall progress (average of task %).
export async function getTaskProgress(projectId) {
  const [tasks, doneMap] = await Promise.all([
    Task.find({ projectId: toId(projectId) }).sort('order').lean(),
    approvedQtyByTask(projectId),
  ]);
  const rows = tasks.map((t) => {
    const done = doneMap[String(t._id)] || 0;
    const percent = t.plannedQty > 0 ? Math.min(100, (done / t.plannedQty) * 100) : 0;
    return {
      taskId: t._id,
      name: t.name,
      unit: t.unit,
      plannedQty: t.plannedQty,
      doneQty: done,
      percent: round1(percent),
      overPlanned: done > t.plannedQty,
    };
  });
  const overall = rows.length ? rows.reduce((s, r) => s + r.percent, 0) / rows.length : 0;
  return { tasks: rows, overallPercent: round1(overall) };
}

// Stock of every material: received - used (in approved updates).
export async function getMaterialStock(projectId) {
  const pid = toId(projectId);
  const [materials, received, used] = await Promise.all([
    Material.find({ projectId: pid }).lean(),
    MaterialReceipt.aggregate([
      { $match: { projectId: pid } },
      { $group: { _id: '$materialId', total: { $sum: '$quantity' } } },
    ]),
    Update.aggregate([
      { $match: { projectId: pid, status: 'approved' } },
      { $unwind: '$items' },
      { $match: { 'items.kind': 'material' } },
      { $group: { _id: '$items.materialId', total: { $sum: '$items.quantity' } } },
    ]),
  ]);
  const recMap = Object.fromEntries(received.map((r) => [String(r._id), r.total]));
  const useMap = Object.fromEntries(used.map((r) => [String(r._id), r.total]));
  return materials.map((m) => {
    const rec = recMap[String(m._id)] || 0;
    const use = useMap[String(m._id)] || 0;
    const stock = rec - use;
    return {
      materialId: m._id,
      name: m.name,
      unit: m.unit,
      received: rec,
      used: use,
      stock,
      lowStock: stock <= m.lowStockLevel,
    };
  });
}

// Money spent vs sanctioned.
export async function getBudget(projectId) {
  const project = await Project.findById(toId(projectId)).lean();
  const [row] = await Expense.aggregate([
    { $match: { projectId: toId(projectId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const spent = row ? row.total : 0;
  const sanctioned = project ? project.sanctionedAmount : 0;
  return {
    sanctioned,
    spent,
    percent: sanctioned > 0 ? round1((spent / sanctioned) * 100) : 0,
  };
}

// Planned progress today, as a straight line from start date to end date.
export function getPlannedPercent(project, onDate = new Date()) {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const now = new Date(onDate).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return round1(((now - start) / (end - start)) * 100);
}

// Everything the project card on the home page needs.
export async function getProjectSummary(projectId) {
  const project = await Project.findById(toId(projectId)).populate('supervisorId', 'name').lean();
  const [progress, stock, budget, openIssues, waiting, lastUpdate] = await Promise.all([
    getTaskProgress(projectId),
    getMaterialStock(projectId),
    getBudget(projectId),
    Issue.countDocuments({ projectId: toId(projectId), status: 'open' }),
    Update.countDocuments({ projectId: toId(projectId), status: 'waiting' }),
    Update.findOne({ projectId: toId(projectId) }).sort({ workDate: -1 }).select('workDate').lean(),
  ]);
  const plannedPercent = getPlannedPercent(project);
  return {
    projectId: project._id,
    name: project.name,
    type: project.type,
    supervisor: project.supervisorId?.name || '',
    progressPercent: progress.overallPercent,
    plannedPercent,
    // "Delayed" if actual progress is more than 10 points behind the plan.
    onTrack: progress.overallPercent >= plannedPercent - 10,
    budget,
    // Flag if spending is more than 20 points ahead of work done.
    budgetWarning: budget.percent - progress.overallPercent > 20,
    lowStockItems: stock.filter((s) => s.lowStock).map((s) => s.name),
    openIssues,
    waitingUpdates: waiting,
    lastUpdateDate: lastUpdate?.workDate || null,
  };
}
