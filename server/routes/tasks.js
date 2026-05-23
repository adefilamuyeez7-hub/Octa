import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadTasks() {
  const data = readFileSync(join(__dirname, '../data/tasks.json'), 'utf8');
  return JSON.parse(data);
}

// GET all tasks
router.get('/', (req, res) => {
  try {
    const tasks = loadTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single task
router.get('/:id', (req, res) => {
  try {
    const tasks = loadTasks();
    const task = tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new task
router.post('/', (req, res) => {
  try {
    const tasks = loadTasks();
    const newTask = {
      id: `task-${Date.now()}`,
      ...req.body,
      createdDate: new Date().toISOString()
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
