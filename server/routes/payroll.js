import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadPayroll() {
  const data = readFileSync(join(__dirname, '../data/payroll.json'), 'utf8');
  return JSON.parse(data);
}

// GET all payroll records
router.get('/', (req, res) => {
  try {
    const payroll = loadPayroll();
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET payroll for employee
router.get('/employee/:employeeId', (req, res) => {
  try {
    const payroll = loadPayroll();
    const records = payroll.filter(p => p.employeeId === req.params.employeeId);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new payroll record
router.post('/', (req, res) => {
  try {
    const payroll = loadPayroll();
    const newRecord = {
      id: `payroll-${Date.now()}`,
      ...req.body,
      createdDate: new Date().toISOString()
    };
    payroll.push(newRecord);
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate payroll for employee
router.post('/calculate', (req, res) => {
  try {
    const { baseSalary, tax, deductions, bonus } = req.body;
    const netSalary = baseSalary - tax - deductions + bonus;
    
    res.json({
      baseSalary,
      tax,
      deductions,
      bonus,
      netSalary,
      grossSalary: baseSalary + bonus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
