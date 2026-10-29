import { Update, Task, Material } from '../models/index.js';
import { getTaskProgress } from '../utils/progress.js';
import { matchUpdate } from '../matching/index.js';
import { addItemNames } from '../utils/names.js';
import { logActivity } from '../utils/activity.js';
import { httpError, checkId } from '../utils/http.js';

const MAX_TEXT = 1000;

const cleanText = (value) => {
  const text = String(value || '').trim();
  if (!text) throw httpError(400, 'Please write what work was done.', 'UPDATE_TEXT_REQUIRED');
  if (text.length > MAX_TEXT) throw httpError(400, `Please keep the update under ${MAX_TEXT} characters.`, 'UPDATE_TOO_LONG', { max: MAX_TEXT });
  return text;
};

// Name of the task or material an item of a fresh match points to (null while it needs a check).
const withName = (item) => {
  const id = String(item.taskId || item.materialId || '');
  const hit = item.matches.find((m) => String(m.refId) === id);
  return { ...item, matchedName: hit ? hit.name : null };
};

// POST /api/match/preview { text } - runs the matcher without saving (live preview while typing)
export async function preview(req, res) {
  const text = cleanText(req.body.text);
  const result = await matchUpdate({ text, projectId: req.user.projectId });
  res.json({ ...result, items: result.items.map(withName) });
}

// POST /api/updates (multipart: text, workDate?, photo?) - translate, match and save as "waiting"
export async function createUpdate(req, res) {
  const text = cleanText(req.body.text);
  let workDate = new Date();
  if (req.body.workDate) {
    workDate = new Date(req.body.workDate);
    if (Number.isNaN(workDate.getTime())) throw httpError(400, 'That date is not valid.', 'INVALID_DATE_GENERIC');
    if (workDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) throw httpError(400, 'The work date cannot be in the future.', 'WORK_DATE_FUTURE');
  }
  const result = await matchUpdate({ text, projectId: req.user.projectId });
  const update = await Update.create({
    projectId: req.user.projectId,
    supervisorId: req.user._id,
    workDate,
    originalText: text,
    language: result.language,
    englishText: result.englishText,
    translationFailed: result.translationFailed,
    partsFound: result.partsFound,
    photoUrl: req.file ? `/uploads/${req.file.filename}` : '',
    items: result.items,
    warnings: result.warnings,
    matchStatus: result.matchStatus,
    status: 'waiting', // nothing is ever auto-approved
  });
  await logActivity({
    projectId: update.projectId, userId: req.user._id, action: 'update_submitted',
    details: update.englishText, refId: update._id,
  });
  res.status(201).json({ update });
}

// GET /api/updates/mine - the supervisor's own updates with status and officer comment
export async function myUpdates(req, res) {
  const updates = await Update.find({ supervisorId: req.user._id }).sort({ workDate: -1, createdAt: -1 }).lean();
  res.json({ updates: await addItemNames(updates) });
}

// GET /api/updates/review?status=waiting - officer's queue: needs_check first, then oldest first
export async function reviewQueue(req, res) {
  const status = req.query.status || 'waiting';
  if (!['waiting', 'approved', 'rejected'].includes(status)) throw httpError(400, 'Unknown status.', 'UNKNOWN_STATUS');
  const updates = await Update.find({ status })
    .populate('projectId', 'name type')
    .populate('supervisorId', 'name')
    .lean();
  // needs_check first (in code, because the text order of the enum is not the order we want)
  updates.sort((a, b) => {
    const rank = (u) => (u.matchStatus === 'needs_check' ? 0 : 1);
    return rank(a) - rank(b) || new Date(a.createdAt) - new Date(b.createdAt);
  });
  res.json({ updates: await addItemNames(updates) });
}

// ---------------------------------------------------------------- Officer review

// Checks the officer's edits and returns the final items list (does not save anything).
async function applyEdits(update, edits = []) {
  if (!Array.isArray(edits)) throw httpError(400, 'Items must be a list.', 'ITEMS_NOT_LIST');
  const [tasks, materials] = await Promise.all([
    Task.find({ projectId: update.projectId }).select('_id').lean(),
    Material.find({ projectId: update.projectId }).select('_id').lean(),
  ]);
  const taskIds = new Set(tasks.map((t) => String(t._id)));
  const materialIds = new Set(materials.map((m) => String(m._id)));
  const items = update.items.map((it) => it.toObject());

  for (const edit of edits) {
    const item = items.find((it) => String(it._id) === String(edit._id));
    if (!item) throw httpError(400, 'One of the edited items does not belong to this update.', 'ITEM_NOT_IN_UPDATE');
    if (edit.quantity !== undefined) {
      const q = Number(edit.quantity);
      if (!Number.isFinite(q) || q < 0) throw httpError(400, 'Quantity must be a number, zero or more.', 'QUANTITY_INVALID');
      item.quantity = q;
    }
    // The officer may pick another task (or material) from the same project.
    if (item.kind === 'task' && edit.taskId) {
      if (!taskIds.has(String(edit.taskId))) throw httpError(400, 'That task is not part of this project.', 'TASK_NOT_IN_PROJECT');
      item.taskId = edit.taskId;
      item.matchStatus = 'matched';
    }
    if (item.kind === 'material' && edit.materialId) {
      if (!materialIds.has(String(edit.materialId))) throw httpError(400, 'That material is not part of this project.', 'MATERIAL_NOT_IN_PROJECT');
      item.materialId = edit.materialId;
      item.matchStatus = 'matched';
    }
  }
  for (const [n, item] of items.entries()) {
    const target = item.kind === 'task' ? item.taskId : item.materialId;
    if (!target) throw httpError(400, `Item ${n + 1}: please choose a ${item.kind} before approving.`, 'ITEM_CHOOSE_TARGET', { n: n + 1, kind: item.kind });
    if (!(item.quantity > 0)) throw httpError(400, `Item ${n + 1}: please enter a quantity above zero.`, 'ITEM_QUANTITY_REQUIRED', { n: n + 1 });
  }
  if (!items.length) throw httpError(400, 'This update has nothing to approve. Please reject it with a comment.', 'NOTHING_TO_APPROVE');
  return items;
}

// Items that push a task above its planned quantity (needs an officer comment to approve).
async function overPlannedTasks(update, items) {
  const { tasks } = await getTaskProgress(update.projectId);
  const added = {};
  items.filter((i) => i.kind === 'task').forEach((i) => {
    added[i.taskId] = (added[i.taskId] || 0) + i.quantity;
  });
  return tasks.filter((t) => added[t.taskId] && t.doneQty + added[t.taskId] > t.plannedQty).map((t) => t.name);
}

// Saves the decision only if the update is still "waiting", in one step.
// Two quick clicks (or two officers) can therefore never decide the same update twice.
async function decide(req, set) {
  const done = await Update.findOneAndUpdate(
    { _id: req.params.id, status: 'waiting' },
    { $set: { ...set, reviewedBy: req.user._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!done) throw httpError(409, 'This update was already approved or rejected.', 'UPDATE_ALREADY_DECIDED');
  return done;
}

async function loadWaiting(id) {
  const update = await Update.findById(checkId(id));
  if (!update) throw httpError(404, 'Update not found.', 'UPDATE_NOT_FOUND');
  if (update.status !== 'waiting') throw httpError(409, 'This update was already approved or rejected.', 'UPDATE_ALREADY_DECIDED');
  return update;
}

// PATCH /api/updates/:id/approve { items?: [{ _id, taskId?, materialId?, quantity? }], comment? }
export async function approve(req, res) {
  const update = await loadWaiting(req.params.id);
  const comment = String(req.body.comment || '').trim();
  const items = await applyEdits(update, req.body.items);
  const over = await overPlannedTasks(update, items);
  if (over.length && !comment) {
    throw httpError(400, `This goes above the planned quantity for ${over.join(', ')}. Please write a comment to approve.`, 'OVER_PLANNED_COMMENT', { tasks: over.join(', ') });
  }
  const done = await decide(req, { status: 'approved', items, officerComment: comment, matchStatus: 'matched' });
  await logActivity({
    projectId: done.projectId, userId: req.user._id, action: 'update_approved',
    details: done.englishText, refId: done._id,
  });
  res.json({ update: done });
}

// PATCH /api/updates/:id/reject { comment }
export async function reject(req, res) {
  const comment = String(req.body.comment || '').trim();
  if (!comment) throw httpError(400, 'Please write a comment so the supervisor knows why.', 'COMMENT_REQUIRED');
  await loadWaiting(req.params.id);
  const done = await decide(req, { status: 'rejected', officerComment: comment });
  await logActivity({
    projectId: done.projectId, userId: req.user._id, action: 'update_rejected',
    details: comment, refId: done._id,
  });
  res.json({ update: done });
}
