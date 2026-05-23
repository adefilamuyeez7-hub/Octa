import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEmployees() {
  const data = readFileSync(join(__dirname, '../data/employees.json'), 'utf8');
  return JSON.parse(data);
}

// GET all employees
router.get('/', (req, res) => {
  try {
    const employees = loadEmployees();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single employee
router.get('/:id', (req, res) => {
  try {
    const employees = loadEmployees();
    const employee = employees.find(e => e.id === req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new employee (in memory only for this demo)
router.post('/', (req, res) => {
  try {
    const employees = loadEmployees();
    const newEmployee = {
      id: `emp-${Date.now()}`,
      ...req.body,
      createdDate: new Date().toISOString()
    };
    employees.push(newEmployee);
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
