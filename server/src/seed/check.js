// Prints each project's progress, stock and budget, calculated from the database.
// Run with:  npm run db:check

import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import { Project } from '../models/index.js';
import { getProjectSummary, getTaskProgress, getMaterialStock } from '../utils/progress.js';

export async function printReport() {
  const projects = await Project.find().sort('createdAt').lean();
  if (!projects.length) {
    console.log('No projects found. Run "npm run seed" first.');
    return;
  }
  for (const p of projects) {
    const s = await getProjectSummary(p._id);
    const { tasks } = await getTaskProgress(p._id);
    const stock = await getMaterialStock(p._id);

    console.log(`\n=== ${s.name}  (supervisor: ${s.supervisor})`);
    console.log(`Progress ${s.progressPercent}%  | planned today ${s.plannedPercent}%  | ${s.onTrack ? 'On track' : 'DELAYED'}`);
    console.log(`Budget   ${s.budget.percent}% spent (Rs ${s.budget.spent.toLocaleString('en-IN')} of ${s.budget.sanctioned.toLocaleString('en-IN')})${s.budgetWarning ? '  <- spending ahead of work' : ''}`);
    console.log(`Open issues ${s.openIssues}  | waiting updates ${s.waitingUpdates}  | low stock: ${s.lowStockItems.join(', ') || 'none'}`);
    console.log('Tasks:');
    tasks.forEach((t) => console.log(`  ${t.name.padEnd(26)} ${String(t.doneQty).padStart(5)} / ${t.plannedQty} ${t.unit}  (${t.percent}%)`));
    console.log('Materials:');
    stock.forEach((m) => console.log(`  ${m.name.padEnd(14)} received ${m.received}, used ${m.used}, stock ${m.stock} ${m.unit}${m.lowStock ? '  LOW' : ''}`));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await connectDB();
    await printReport();
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
