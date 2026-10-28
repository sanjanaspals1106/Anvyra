// Material receipts, issues, expenses and supervisors.
import bcrypt from 'bcryptjs';
import { Material, MaterialReceipt, Issue, Expense, Project, User } from '../models/index.js';
import { logActivity } from '../utils/activity.js';
import { httpError, checkId } from '../utils/http.js';

const money = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`;

function parseDate(value, label = 'date') {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) throw httpError(400, `That ${label} is not valid.`);
  return d;
}

function positive(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw httpError(400, `${label} must be a number above zero.`);
  return n;
}

// ---------------------------------------------------------------- Material receipts

// GET /api/projects/:id/receipts
export async function listReceipts(req, res) {
  const receipts = await MaterialReceipt.find({ projectId: checkId(req.params.id) })
    .sort({ date: -1 }).populate('materialId', 'name unit').lean();
  res.json({ receipts });
}

// POST /api/projects/:id/receipts { materialId, quantity, date?, note? } - supervisor
export async function addReceipt(req, res) {
  const material = await Material.findOne({ _id: checkId(req.body.materialId, 'material'), projectId: req.params.id });
  if (!material) throw httpError(400, 'That material is not part of this project.');
  const receipt = await MaterialReceipt.create({
    projectId: req.params.id,
    materialId: material._id,
    quantity: positive(req.body.quantity, 'Quantity'),
    date: parseDate(req.body.date),
    note: String(req.body.note || '').trim(),
    addedBy: req.user._id,
  });
  await logActivity({
    projectId: receipt.projectId, userId: req.user._id, action: 'material_received',
    details: `${receipt.quantity} ${material.unit} ${material.name} received`, refId: receipt._id,
  });
  res.status(201).json({ receipt });
}

// ---------------------------------------------------------------- Issues

const ISSUE_TYPES = Issue.schema.path('type').enumValues;

// GET /api/projects/:id/issues?status=
export async function projectIssues(req, res) {
  const filter = { projectId: checkId(req.params.id) };
  if (req.query.status) filter.status = req.query.status;
  res.json({ issues: await Issue.find(filter).sort({ raisedAt: -1 }).populate('raisedBy', 'name').lean() });
}

// GET /api/issues?projectId=&status= - officer, all projects
export async function allIssues(req, res) {
  const filter = {};
  if (req.query.projectId) filter.projectId = checkId(req.query.projectId, 'project id');
  if (req.query.status) {
    if (!['open', 'resolved'].includes(req.query.status)) throw httpError(400, 'Unknown status.');
    filter.status = req.query.status;
  }
  const issues = await Issue.find(filter).sort({ raisedAt: -1 })
    .populate('projectId', 'name type').populate('raisedBy', 'name').populate('resolvedBy', 'name').lean();
  res.json({ issues });
}

// POST /api/projects/:id/issues (multipart: type, description, photo?) - supervisor
export async function addIssue(req, res) {
  const { type } = req.body;
  const description = String(req.body.description || '').trim();
  if (!ISSUE_TYPES.includes(type)) throw httpError(400, `Issue type must be one of: ${ISSUE_TYPES.join(', ')}.`);
  if (!description) throw httpError(400, 'Please describe the problem.');
  const issue = await Issue.create({
    projectId: req.params.id, type, description,
    photoUrl: req.file ? `/uploads/${req.file.filename}` : '',
    raisedBy: req.user._id,
  });
  await logActivity({
    projectId: issue.projectId, userId: req.user._id, action: 'issue_raised',
    details: description, refId: issue._id,
  });
  res.status(201).json({ issue });
}

// PATCH /api/issues/:id/resolve { note } - officer
export async function resolveIssue(req, res) {
  const note = String(req.body.note || '').trim();
  if (!note) throw httpError(400, 'Please write a note about how it was resolved.');
  const issue = await Issue.findOneAndUpdate(
    { _id: checkId(req.params.id), status: 'open' },
    { $set: { status: 'resolved', resolutionNote: note, resolvedBy: req.user._id, resolvedAt: new Date() } },
    { new: true }
  );
  if (!issue) throw httpError(409, 'This issue does not exist or is already resolved.');
  await logActivity({
    projectId: issue.projectId, userId: req.user._id, action: 'issue_resolved', details: note, refId: issue._id,
  });
  res.json({ issue });
}

// ---------------------------------------------------------------- Expenses (officer)

// GET /api/projects/:id/expenses
export async function listExpenses(req, res) {
  res.json({ expenses: await Expense.find({ projectId: checkId(req.params.id) }).sort({ date: -1 }).lean() });
}

// POST /api/projects/:id/expenses { amount, date?, note? }
export async function addExpense(req, res) {
  if (!(await Project.exists({ _id: checkId(req.params.id) }))) throw httpError(404, 'Project not found.');
  const expense = await Expense.create({
    projectId: req.params.id,
    amount: positive(req.body.amount, 'Amount'),
    date: parseDate(req.body.date),
    note: String(req.body.note || '').trim(),
    addedBy: req.user._id,
  });
  await logActivity({
    projectId: expense.projectId, userId: req.user._id, action: 'expense_added',
    details: `${money(expense.amount)}${expense.note ? ` - ${expense.note}` : ''}`, refId: expense._id,
  });
  res.status(201).json({ expense });
}

// ---------------------------------------------------------------- Supervisors (officer)

// GET /api/supervisors -> { supervisors: current ones (one per project), former: replaced ones }
export async function listSupervisors(_req, res) {
  const all = await User.find({ role: 'supervisor' }).sort('createdAt').populate('projectId', 'name type').lean();
  res.json({
    supervisors: all.filter((u) => u.active !== false),
    former: all.filter((u) => u.active === false),
  });
}

// PUT /api/projects/:id/supervisor
//   { supervisorId }                          choose a former supervisor again, or
//   { name, email, password, language }       create a new one
// The project keeps exactly one active supervisor. The old one can no longer sign in, but stays in
// the database, so their past updates and activity log entries still show their name.
export async function changeSupervisor(req, res) {
  const project = await Project.findById(checkId(req.params.id));
  if (!project) throw httpError(404, 'Project not found.');

  let next;
  if (req.body.supervisorId) {
    next = await User.findOne({ _id: checkId(req.body.supervisorId, 'supervisor'), role: 'supervisor' });
    if (!next) throw httpError(400, 'That supervisor does not exist.');
    if (next.active !== false) throw httpError(400, 'That supervisor is already working on a project.');
  } else {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const language = req.body.language || 'en';
    if (!name) throw httpError(400, 'Please enter the name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'Please enter a valid email.');
    if (password.length < 6) throw httpError(400, 'The password must have at least 6 characters.');
    if (!['en', 'hi', 'te'].includes(language)) throw httpError(400, 'Unknown language.');
    if (await User.exists({ email })) throw httpError(409, 'Someone already uses this email.');
    next = new User({ name, email, language, role: 'supervisor', passwordHash: await bcrypt.hash(password, 10) });
  }

  const old = await User.findOne({ role: 'supervisor', projectId: project._id, active: { $ne: false }, _id: { $ne: next._id } });
  if (old) {
    old.active = false;
    await old.save();
  }
  next.projectId = project._id;
  next.active = true;
  await next.save();
  project.supervisorId = next._id;
  await project.save();

  await logActivity({
    projectId: project._id, userId: req.user._id, action: 'supervisor_changed',
    details: old ? `${old.name} replaced by ${next.name}` : `${next.name} is now the supervisor`, refId: next._id,
  });
  res.json({ supervisor: next, previous: old || null });
}
