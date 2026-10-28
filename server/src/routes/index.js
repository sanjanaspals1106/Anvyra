import { Router } from 'express';
import { requireAuth, requireRole, projectAccess } from '../middleware/auth.js';
import { wrap } from '../utils/http.js';
import * as auth from '../controllers/auth.js';
import * as dash from '../controllers/dashboard.js';
import * as projects from '../controllers/projects.js';
import * as updates from '../controllers/updates.js';
import * as records from '../controllers/records.js';
import { uploadPhoto } from '../middleware/upload.js';

const router = Router();
const officer = requireRole('officer');

router.post('/auth/login', wrap(auth.login));
router.get('/auth/me', requireAuth, auth.me);
router.patch('/auth/language', requireAuth, wrap(auth.setLanguage));

// Everything below needs a signed-in user.
router.use(requireAuth);

router.get('/dashboard', officer, wrap(dash.dashboard));
router.get('/dashboard/counts', officer, wrap(dash.counts));
router.get('/dashboard/progress-history', officer, wrap(dash.progressHistory));

router.get('/projects', wrap(projects.listProjects));
router.get('/projects/:id', projectAccess(), wrap(projects.getProject));
router.get('/projects/:id/updates', projectAccess(), wrap(projects.projectUpdates));
router.get('/projects/:id/activity', officer, wrap(projects.projectActivity));

const supervisor = requireRole('supervisor');

router.post('/match/preview', supervisor, wrap(updates.preview));
router.post('/updates', supervisor, uploadPhoto, wrap(updates.createUpdate));
router.get('/updates/mine', supervisor, wrap(updates.myUpdates));
router.get('/updates/review', officer, wrap(updates.reviewQueue));
router.patch('/updates/:id/approve', officer, wrap(updates.approve));
router.patch('/updates/:id/reject', officer, wrap(updates.reject));

router.get('/projects/:id/receipts', projectAccess(), wrap(records.listReceipts));
router.post('/projects/:id/receipts', supervisor, projectAccess(), wrap(records.addReceipt));

router.get('/projects/:id/issues', projectAccess(), wrap(records.projectIssues));
router.post('/projects/:id/issues', supervisor, projectAccess(), uploadPhoto, wrap(records.addIssue));
router.get('/issues', officer, wrap(records.allIssues));
router.patch('/issues/:id/resolve', officer, wrap(records.resolveIssue));

router.get('/projects/:id/expenses', officer, wrap(records.listExpenses));
router.post('/projects/:id/expenses', officer, wrap(records.addExpense));

router.get('/supervisors', officer, wrap(records.listSupervisors));
router.post('/supervisors', officer, wrap(records.addSupervisor));

export default router;
