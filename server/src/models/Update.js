import mongoose from 'mongoose';

// One suggestion from the matcher: a task or material with its score and reasons.
const matchSchema = new mongoose.Schema(
  {
    refId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    score: { type: Number, required: true }, // 0 to 1
    reasons: { type: [String], default: [] },
  },
  { _id: false }
);

// One part of an update. "Completed 2 columns, used 40 bags cement" has two items.
const itemSchema = new mongoose.Schema({
  kind: { type: String, enum: ['task', 'material'], required: true },
  text: { type: String, default: '' }, // the part of the sentence this item came from
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  reportedQty: { type: Number }, // what the supervisor wrote
  quantity: { type: Number, required: true, min: 0 }, // final value (officer may edit)
  unit: { type: String, default: '' },
  matches: { type: [matchSchema], default: [] }, // top 3
  matchStatus: { type: String, enum: ['matched', 'needs_check'], default: 'needs_check' }, // for this item
  warnings: { type: [String], default: [] }, // checks shown to the officer
});

const updateSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workDate: { type: Date, required: true },
    originalText: { type: String, required: true },
    language: { type: String, enum: ['en', 'hi', 'te'], default: 'en' },
    englishText: { type: String, default: '' },
    translationFailed: { type: Boolean, default: false }, // translation was needed but did not work
    partsFound: { type: Number, default: 0 }, // how many parts the text was split into
    warnings: { type: [String], default: [] }, // all checks of all items, for the review screen
    photoUrl: { type: String, default: '' },
    items: { type: [itemSchema], default: [] },
    matchStatus: { type: String, enum: ['matched', 'needs_check'], default: 'needs_check' },
    status: { type: String, enum: ['waiting', 'approved', 'rejected'], default: 'waiting' },
    officerComment: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

updateSchema.index({ projectId: 1, status: 1 });
updateSchema.index({ projectId: 1, workDate: -1 });

export default mongoose.model('Update', updateSchema);
