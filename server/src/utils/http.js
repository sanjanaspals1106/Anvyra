import mongoose from 'mongoose';

// An Error that carries an HTTP status code.
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Lets async route handlers throw errors without try/catch in every one.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Returns the id if it is a valid MongoDB id, otherwise throws a 400.
export function checkId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid ${label}.`);
  return id;
}
