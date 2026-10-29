import mongoose from 'mongoose';

// One piece of work in a project, e.g. "Pole erection", 80 nos.
const taskSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    nameHi: { type: String, default: '', trim: true }, // shown in Hindi / Telugu; the matcher only uses `name`
    nameTe: { type: String, default: '', trim: true },
    unit: { type: String, required: true }, // m, cu m, nos, houses, %
    plannedQty: { type: Number, required: true, min: 0 },
    // Words the matcher looks for, in English, Hindi and Telugu.
    keywords: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
