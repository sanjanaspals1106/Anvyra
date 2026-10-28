import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { notFound, errorHandler } from './middleware/error.js';

export const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR)); // uploaded photos
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 5001;
  await connectDB();
  app.listen(port, () => console.log(`ANVYRA API running on http://localhost:${port}`));
}
