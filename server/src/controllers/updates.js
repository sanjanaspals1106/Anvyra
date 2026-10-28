import { Update } from '../models/index.js';
import { matchUpdate } from '../matching/index.js';
import { logActivity } from '../utils/activity.js';
import { httpError } from '../utils/http.js';

const MAX_TEXT = 1000;

const cleanText = (value) => {
  const text = String(value || '').trim();
  if (!text) throw httpError(400, 'Please write what work was done.');
  if (text.length > MAX_TEXT) throw httpError(400, `Please keep the update under ${MAX_TEXT} characters.`);
  return text;
};

// Name of the task or material an item was matched to (or null while it still needs a check).
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
    if (Number.isNaN(workDate.getTime())) throw httpError(400, 'That date is not valid.');
    if (workDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) throw httpError(400, 'The work date cannot be in the future.');
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
  res.json({ updates: updates.map((u) => ({ ...u, items: u.items.map(withName) })) });
}

// GET /api/updates/review?status=waiting - officer's queue: needs_check first, then oldest first
export async function reviewQueue(req, res) {
  const status = req.query.status || 'waiting';
  if (!['waiting', 'approved', 'rejected'].includes(status)) throw httpError(400, 'Unknown status.');
  const updates = await Update.find({ status })
    .populate('projectId', 'name type')
    .populate('supervisorId', 'name')
    .lean();
  // needs_check first (in code, because the text order of the enum is not the order we want)
  updates.sort((a, b) => {
    const rank = (u) => (u.matchStatus === 'needs_check' ? 0 : 1);
    return rank(a) - rank(b) || new Date(a.createdAt) - new Date(b.createdAt);
  });
  res.json({ updates: updates.map((u) => ({ ...u, items: u.items.map(withName) })) });
}
