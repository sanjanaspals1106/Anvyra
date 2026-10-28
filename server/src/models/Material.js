import mongoose from 'mongoose';

// A material used on a project, e.g. Cement (bags).
// Stock is never stored: it is total received - total used in approved updates.
const materialSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true }, // bags, kg, nos, m, cu m
    keywords: { type: [String], default: [] },
    lowStockLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Material', materialSchema);
