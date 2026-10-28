import { Task, Material } from '../models/index.js';

// Adds `matchedName` to every item of the given updates: the name of the task or material
// the item points to (null while the item still needs a check). One query for all updates.
export async function addItemNames(updates) {
  const taskIds = new Set();
  const materialIds = new Set();
  for (const u of updates) {
    for (const it of u.items) {
      if (it.taskId) taskIds.add(String(it.taskId));
      if (it.materialId) materialIds.add(String(it.materialId));
    }
  }
  const [tasks, materials] = await Promise.all([
    Task.find({ _id: { $in: [...taskIds] } }).select('name').lean(),
    Material.find({ _id: { $in: [...materialIds] } }).select('name').lean(),
  ]);
  const names = Object.fromEntries([...tasks, ...materials].map((x) => [String(x._id), x.name]));
  return updates.map((u) => ({
    ...u,
    items: u.items.map((it) => ({ ...it, matchedName: names[String(it.taskId || it.materialId || '')] || null })),
  }));
}
