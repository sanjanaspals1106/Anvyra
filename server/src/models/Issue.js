import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    type: { type: String, enum: ['weather', 'material', 'labour', 'land', 'other'], required: true },
    description: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    resolutionNote: { type: String, default: '' },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    raisedAt: { type: Date, default: Date.now },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

issueSchema.index({ projectId: 1, status: 1 });

export default mongoose.model('Issue', issueSchema);
