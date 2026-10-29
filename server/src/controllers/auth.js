import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { httpError } from '../utils/http.js';

// POST /api/auth/login  { email, password } -> { token, user }
export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) throw httpError(400, 'Please enter your email and password.', 'LOGIN_FIELDS_REQUIRED');
  const user = await User.findOne({ email });
  // Same message for "no such user" and "wrong password" so emails can't be guessed.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw httpError(401, 'Wrong email or password.', 'LOGIN_WRONG');
  }
  if (user.active === false) throw httpError(403, 'This account is no longer active. Please ask the Village Officer.', 'ACCOUNT_INACTIVE');
  res.json({ token: signToken(user), user });
}

// GET /api/auth/me
export const me = (req, res) => res.json({ user: req.user });

// PATCH /api/auth/language  { language } - remembers the chosen language on the user
export async function setLanguage(req, res) {
  const { language } = req.body;
  if (!['en', 'hi', 'te'].includes(language)) throw httpError(400, 'Unknown language.', 'UNKNOWN_LANGUAGE');
  req.user.language = language;
  await req.user.save();
  res.json({ user: req.user });
}
