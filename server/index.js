import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import employeesRouter from './routes/employees.js';
import payrollRouter from './routes/payroll.js';
import teamsRouter from './routes/teams.js';
import tasksRouter from './routes/tasks.js';
import grokRouter from './routes/grok.js';
import notionRouter from './routes/notion.js';
import performanceRouter from './routes/performance.js';
import chatRouter from './routes/chat.js';
import agentRouter from './routes/agent.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/employees', employeesRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/grok', grokRouter);
app.use('/api/notion', notionRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/chat', chatRouter);
app.use('/api/agent', agentRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
