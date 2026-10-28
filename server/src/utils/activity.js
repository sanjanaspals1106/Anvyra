import { ActivityLog } from '../models/index.js';

// Adds one line to the activity log. Never throws: logging must not break an action.
export async function logActivity({ projectId, userId, action, details = '', refId }) {
  try {
    await ActivityLog.create({ projectId, userId, action, details, refId });
  } catch (err) {
    console.error('Could not write activity log:', err.message);
  }
}
