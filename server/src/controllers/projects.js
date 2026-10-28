import { Project, Update, Issue, ActivityLog } from '../models/index.js';
import {
  getProjectSummary, getTaskProgress, getMaterialStock, getBudget, getPlannedPercent,
} from '../utils/progress.js';
import { addItemNames } from '../utils/names.js';
import { httpError, checkId } from '../utils/http.js';

// GET /api/projects - officer: all projects, supervisor: only their own
export async function listProjects(req, res) {
  const filter = req.user.role === 'officer' ? {} : { _id: req.user.projectId };
  const projects = await Project.find(filter).sort('createdAt').lean();
  res.json({ projects: await Promise.all(projects.map((p) => getProjectSummary(p._id))) });
}

// GET /api/projects/:id - project with tasks, stock, budget and open issues
export async function getProject(req, res) {
  const project = await Project.findById(checkId(req.params.id)).populate('supervisorId', 'name email language').lean();
  if (!project) throw httpError(404, 'Project not found.');
  const [summary, progress, stock, budget, openIssues] = await Promise.all([
    getProjectSummary(project._id),
    getTaskProgress(project._id),
    getMaterialStock(project._id),
    getBudget(project._id),
    Issue.find({ projectId: project._id, status: 'open' }).sort('-raisedAt').lean(),
  ]);
  res.json({
    project: { ...project, plannedPercent: getPlannedPercent(project) },
    summary,
    tasks: progress.tasks,
    progressPercent: progress.overallPercent,
    materials: stock,
    budget,
    openIssues,
  });
}

// GET /api/projects/:id/updates?status=waiting|approved|rejected - newest first
export async function projectUpdates(req, res) {
  const filter = { projectId: checkId(req.params.id) };
  if (req.query.status) {
    if (!['waiting', 'approved', 'rejected'].includes(req.query.status)) throw httpError(400, 'Unknown status.');
    filter.status = req.query.status;
  }
  const updates = await Update.find(filter).sort({ workDate: -1, createdAt: -1 }).populate('supervisorId', 'name').lean();
  res.json({ updates: await addItemNames(updates) });
}

// GET /api/projects/:id/activity - officer only
export async function projectActivity(req, res) {
  const log = await ActivityLog.find({ projectId: checkId(req.params.id) })
    .sort({ at: -1 }).limit(100).populate('userId', 'name role').lean();
  res.json({ activity: log });
}
