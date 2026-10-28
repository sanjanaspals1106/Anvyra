import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { httpError } from '../utils/http.js';

const secret = () => process.env.JWT_SECRET || 'anvyra-dev-secret-change-me';

export const signToken = (user) => jwt.sign({ id: user._id }, secret(), { expiresIn: '7d' });

// Checks the JWT and loads the user from the database on every request,
// so a deleted user or a changed role takes effect immediately.
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw httpError(401, 'Please sign in first.');
    let payload;
    try {
      payload = jwt.verify(token, secret());
    } catch {
      throw httpError(401, 'Your session has expired. Please sign in again.');
    }
    const user = await User.findById(payload.id);
    if (!user) throw httpError(401, 'This account no longer exists.');
    if (user.active === false) throw httpError(401, 'This account is no longer active.');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole = (role) => (req, _res, next) =>
  req.user?.role === role ? next() : next(httpError(403, 'You are not allowed to do this.'));

// Officer may use any project. A supervisor only their own, whatever the URL says.
// Use on routes that have a project id in req.params[param].
export const projectAccess = (param = 'id') => (req, _res, next) => {
  if (req.user.role === 'officer') return next();
  if (String(req.user.projectId) === String(req.params[param])) return next();
  next(httpError(403, 'You can only see your own project.'));
};
