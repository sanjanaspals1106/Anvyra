import mongoose from 'mongoose';

// An Error that carries an HTTP status code and a short code (e.g. COMMENT_REQUIRED).
// The English message is the fallback; the app shows its own translation of the code,
// filling in `params` (e.g. { max: 1000 }).
export function httpError(status, message, code = 'ERROR', params = undefined) {
  const err = new Error(message);
  err.status = status;
  err.errCode = code;
  err.params = params;
  return err;
}

// Lets async route handlers throw errors without try/catch in every one.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Returns the id if it is a valid MongoDB id, otherwise throws a 400.
export function checkId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid ${label}.`, 'INVALID_ID');
  return id;
}
