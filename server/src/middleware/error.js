// Turns any error into { error: "message" } JSON with the right status code.
export function notFound(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message;
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid value sent.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That value is already in use.';
  } else if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Photo is too big (max 5 MB).' : err.message;
  }
  if (status >= 500) {
    console.error(err);
    message = 'Something went wrong on the server.';
  }
  res.status(status).json({ error: message });
}
