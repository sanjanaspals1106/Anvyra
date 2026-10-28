import { Project, Update, Issue } from '../models/index.js';
import { getProjectSummary } from '../utils/progress.js';
import { getProgressHistory } from '../utils/history.js';

// GET /api/dashboard - the officer's village summary
export async function dashboard(_req, res) {
  const projects = await Project.find().sort('createdAt').lean();
  const summaries = await Promise.all(projects.map((p) => getProjectSummary(p._id)));
  const sanctioned = summaries.reduce((s, p) => s + p.budget.sanctioned, 0);
  const spent = summaries.reduce((s, p) => s + p.budget.spent, 0);
  const [waitingUpdates, openIssues] = await Promise.all([
    Update.countDocuments({ status: 'waiting' }),
    Issue.countDocuments({ status: 'open' }),
  ]);
  const overall = summaries.length ? summaries.reduce((s, p) => s + p.progressPercent, 0) / summaries.length : 0;
  res.json({
    village: projects[0]?.village || '',
    overallPercent: Math.round(overall * 10) / 10,
    waitingUpdates,
    openIssues,
    budget: { sanctioned, spent, percent: sanctioned ? Math.round((spent / sanctioned) * 1000) / 10 : 0 },
    projects: summaries,
  });
}

// GET /api/dashboard/progress-history - weekly points for the line chart
export async function progressHistory(_req, res) {
  res.json({ projects: await getProgressHistory() });
}

// GET /api/dashboard/counts - small numbers for the sidebar badges
export async function counts(_req, res) {
  const [waitingUpdates, openIssues] = await Promise.all([
    Update.countDocuments({ status: 'waiting' }),
    Issue.countDocuments({ status: 'open' }),
  ]);
  res.json({ waitingUpdates, openIssues });
}
