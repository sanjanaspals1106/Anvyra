// Fills the database with the demo village and its 4 projects.
// WARNING: this deletes all existing ANVYRA data first.
// Run with:  npm run seed

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User, Project, Task, Material, Update, MaterialReceipt, Issue, Expense, ActivityLog,
} from '../models/index.js';
import { VILLAGE, DEMO_PASSWORD, officer, projects, waitingUpdates } from './data.js';
import { matchUpdate } from '../matching/index.js';
import { withNames, projectNames, projectDescriptions, taskNames, materialNames } from './translations.js';

const d = (s) => new Date(`${s}T10:00:00+05:30`); // dates in Indian time
const nextDay = (s) => new Date(d(s).getTime() + 24 * 60 * 60 * 1000);

export async function seed() {
  // 1. Clear old data
  await Promise.all(
    [User, Project, Task, Material, Update, MaterialReceipt, Issue, Expense, ActivityLog].map((m) => m.deleteMany({}))
  );
  await Promise.all(
    [User, Project, Task, Material, Update, MaterialReceipt, Issue, Expense, ActivityLog].map((m) => m.syncIndexes())
  );

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const officerUser = await User.create({ ...officer, passwordHash });
  const logs = [];

  for (const p of projects) {
    // 2. Project and its supervisor
    const project = await Project.create({
      ...withNames(p.project, projectNames, projectDescriptions),
      village: VILLAGE,
      startDate: d(p.project.startDate),
      endDate: d(p.project.endDate),
    });
    const supervisor = await User.create({
      ...p.supervisor,
      role: 'supervisor',
      projectId: project._id,
      passwordHash,
    });
    project.supervisorId = supervisor._id;
    await project.save();
    logs.push({ projectId: project._id, userId: officerUser._id, action: 'supervisor_added',
      details: `${supervisor.name} added as supervisor`, refId: supervisor._id, at: d(p.project.startDate) });

    // 3. Tasks and materials (keep name -> id lookups for the updates)
    const tasks = await Task.insertMany(p.tasks.map((t, i) => ({ ...withNames(t, taskNames), projectId: project._id, order: i + 1 })));
    const materials = await Material.insertMany(p.materials.map((m) => ({ ...withNames(m, materialNames), projectId: project._id })));
    const taskByName = Object.fromEntries(tasks.map((t) => [t.name, t]));
    const matByName = Object.fromEntries(materials.map((m) => [m.name, m]));
    const findTask = (name) => {
      if (!taskByName[name]) throw new Error(`Unknown task "${name}" in ${project.name}`);
      return taskByName[name];
    };
    const findMat = (name) => {
      if (!matByName[name]) throw new Error(`Unknown material "${name}" in ${project.name}`);
      return matByName[name];
    };

    // 4. Material deliveries
    for (const r of p.receipts) {
      const mat = findMat(r.material);
      const receipt = await MaterialReceipt.create({
        projectId: project._id, materialId: mat._id, quantity: r.quantity,
        date: d(r.date), note: r.note, addedBy: supervisor._id,
      });
      logs.push({ projectId: project._id, userId: supervisor._id, action: 'material_received',
        details: `${r.quantity} ${mat.unit} ${mat.name} received`, refId: receipt._id, at: d(r.date) });
    }

    // 5. Approved progress updates (history)
    for (const u of p.updates) {
      const items = u.items.map((it) => {
        if (it.task) {
          const t = findTask(it.task);
          return { kind: 'task', taskId: t._id, reportedQty: it.qty, quantity: it.qty, unit: t.unit,
            matches: [{ refId: t._id, name: t.name, score: 1, reasons: ['demo history'] }] };
        }
        const m = findMat(it.material);
        return { kind: 'material', materialId: m._id, reportedQty: it.qty, quantity: it.qty, unit: m.unit,
          matches: [{ refId: m._id, name: m.name, score: 1, reasons: ['demo history'] }] };
      });
      const update = await Update.create({
        projectId: project._id,
        supervisorId: supervisor._id,
        workDate: d(u.date),
        originalText: u.text,
        language: u.lang,
        englishText: u.english || u.text,
        items,
        matchStatus: 'matched',
        status: 'approved',
        reviewedBy: officerUser._id,
        reviewedAt: nextDay(u.date),
      });
      logs.push(
        { projectId: project._id, userId: supervisor._id, action: 'update_submitted',
          details: update.englishText, refId: update._id, at: d(u.date) },
        { projectId: project._id, userId: officerUser._id, action: 'update_approved',
          details: update.englishText, refId: update._id, at: nextDay(u.date) }
      );
    }

    // 6. Issues
    for (const i of p.issues) {
      const issue = await Issue.create({
        projectId: project._id, type: i.type, description: i.description, status: i.status,
        raisedBy: supervisor._id, raisedAt: d(i.raisedAt),
        ...(i.status === 'resolved'
          ? { resolvedBy: officerUser._id, resolvedAt: d(i.resolvedAt), resolutionNote: i.resolutionNote }
          : {}),
      });
      logs.push({ projectId: project._id, userId: supervisor._id, action: 'issue_raised',
        details: i.description, refId: issue._id, at: d(i.raisedAt) });
      if (i.status === 'resolved') {
        logs.push({ projectId: project._id, userId: officerUser._id, action: 'issue_resolved',
          details: i.resolutionNote, refId: issue._id, at: d(i.resolvedAt) });
      }
    }

    // 7. Expenses
    for (const e of p.expenses) {
      const exp = await Expense.create({ projectId: project._id, amount: e.amount, date: d(e.date),
        note: e.note, addedBy: officerUser._id });
      logs.push({ projectId: project._id, userId: officerUser._id, action: 'expense_added',
        details: `Rs ${e.amount.toLocaleString('en-IN')} - ${e.note}`, refId: exp._id, at: d(e.date) });
    }
  }

  // 8. Waiting updates: run through the real matcher, translation replaced by the English text
  const supervisors = await User.find({ role: 'supervisor' }).lean();
  for (const w of waitingUpdates) {
    const project = await Project.findOne({ name: w.project }).lean();
    const sup = supervisors.find((s) => String(s.projectId) === String(project._id));
    const result = await matchUpdate({
      text: w.text,
      projectId: project._id,
      translate: async (text) => ({ text: w.english || text, ok: true }),
    });
    const update = await Update.create({
      projectId: project._id, supervisorId: sup._id, workDate: d(w.date), originalText: w.text,
      language: result.language, englishText: result.englishText, partsFound: result.partsFound,
      items: result.items, warnings: result.warnings, matchStatus: result.matchStatus, status: 'waiting',
    });
    logs.push({ projectId: project._id, userId: sup._id, action: 'update_submitted',
      details: update.englishText, refId: update._id, at: d(w.date) });
  }

  await ActivityLog.insertMany(logs);
}

// Run directly: npm run seed
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await connectDB();
    await seed();
    const counts = {
      users: await User.countDocuments(),
      projects: await Project.countDocuments(),
      tasks: await Task.countDocuments(),
      materials: await Material.countDocuments(),
      updates: await Update.countDocuments(),
      receipts: await MaterialReceipt.countDocuments(),
      issues: await Issue.countDocuments(),
      expenses: await Expense.countDocuments(),
      activityLogs: await ActivityLog.countDocuments(),
    };
    console.log('Seed complete:', counts);
    console.log(`\nLogin with any of these (password: ${DEMO_PASSWORD}):`);
    console.log(`  ${officer.email}  (Village Officer)`);
    projects.forEach((p) => console.log(`  ${p.supervisor.email}  (${p.project.name} supervisor)`));
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
