import mongoose from 'mongoose';

// Who did what, and when. Entries are only ever added, never changed.
const activityLogSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    enum: [
      'update_submitted',
      'update_approved',
      'update_rejected',
      'material_received',
      'issue_raised',
      'issue_resolved',
      'expense_added',
      'supervisor_added',
    ],
    required: true,
  },
  details: { type: String, default: '' },
  refId: { type: mongoose.Schema.Types.ObjectId },
  at: { type: Date, default: Date.now },
});

export default mongoose.model('ActivityLog', activityLogSchema);
