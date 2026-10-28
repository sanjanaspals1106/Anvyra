import mongoose from 'mongoose';

// A delivery of material to the site, logged by the supervisor.
const materialReceiptSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
    quantity: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('MaterialReceipt', materialReceiptSchema);
