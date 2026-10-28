import mongoose from 'mongoose';

// Two roles only: the Village Officer (one per village) and a Site Supervisor (one per project).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['officer', 'supervisor'], required: true },
    // A supervisor who was replaced is kept (their updates and log entries still point to them) but cannot sign in.
    active: { type: Boolean, default: true },
    language: { type: String, enum: ['en', 'hi', 'te'], default: 'en' },
    // Only supervisors belong to a project. The officer sees every project.
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: function () {
        return this.role === 'supervisor';
      },
    },
  },
  { timestamps: true }
);

// Never send the password hash back in API responses.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
