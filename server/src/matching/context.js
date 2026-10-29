import { Project, Task, Material } from '../models/index.js';
import { getTaskProgress, getMaterialStock } from '../utils/progress.js';

// Everything the matcher needs to know about one project:
// its tasks (with how much is done) and its materials (with current stock).
export async function loadContext(projectId) {
  const [project, tasks, materials, progress, stock] = await Promise.all([
    Project.findById(projectId).select('name type').lean(),
    Task.find({ projectId }).sort('order').lean(),
    Material.find({ projectId }).lean(),
    getTaskProgress(projectId),
    getMaterialStock(projectId),
  ]);
  const done = Object.fromEntries(progress.tasks.map((t) => [String(t.taskId), t.doneQty]));
  const left = Object.fromEntries(stock.map((s) => [String(s.materialId), s.stock]));
  return {
    projectName: project?.name || '',
    projectType: project?.type || '',
    tasks: tasks.map((t) => ({
      id: t._id, name: t.name, unit: t.unit, plannedQty: t.plannedQty,
      keywords: t.keywords, doneQty: done[String(t._id)] || 0,
    })),
    materials: materials.map((m) => ({
      id: m._id, name: m.name, unit: m.unit, keywords: m.keywords, stock: left[String(m._id)] || 0,
    })),
  };
}
