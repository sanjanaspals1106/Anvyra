import mongoose from 'mongoose';

// Money spent on a project, entered by the officer.
const expenseSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    amount: { type: Number, required: true, min: 0 }, // in rupees
    date: { type: Date, required: true },
    note: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Expense', expenseSchema);
