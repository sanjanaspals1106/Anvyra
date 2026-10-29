import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameHi: { type: String, default: '', trim: true }, // shown in Hindi / Telugu; the matcher only uses `name`
    nameTe: { type: String, default: '', trim: true },
    type: { type: String, enum: ['housing', 'water_tank', 'canal', 'electricity'], required: true },
    village: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    descriptionHi: { type: String, default: '' },
    descriptionTe: { type: String, default: '' },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    sanctionedAmount: { type: Number, required: true, min: 0 }, // in rupees
    status: { type: String, enum: ['active', 'completed', 'on_hold'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
