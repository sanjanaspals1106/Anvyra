import { Router } from 'express';
import { requireAuth, requireRole, projectAccess } from '../middleware/auth.js';
import { wrap } from '../utils/http.js';
import * as auth from '../controllers/auth.js';
import * as dash from '../controllers/dashboard.js';
import * as projects from '../controllers/projects.js';

const router = Router();
const officer = requireRole('officer');

router.post('/auth/login', wrap(auth.login));
router.get('/auth/me', requireAuth, auth.me);
router.patch('/auth/language', requireAuth, wrap(auth.setLanguage));

// Everything below needs a signed-in user.
router.use(requireAuth);

router.get('/dashboard', officer, wrap(dash.dashboard));
router.get('/dashboard/progress-history', officer, wrap(dash.progressHistory));

router.get('/projects', wrap(projects.listProjects));
router.get('/projects/:id', projectAccess(), wrap(projects.getProject));
router.get('/projects/:id/updates', projectAccess(), wrap(projects.projectUpdates));
router.get('/projects/:id/activity', officer, wrap(projects.projectActivity));

export default router;
