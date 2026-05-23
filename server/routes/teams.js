import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadTeams() {
  const data = readFileSync(join(__dirname, '../data/teams.json'), 'utf8');
  return JSON.parse(data);
}

// GET all teams
router.get('/', (req, res) => {
  try {
    const teams = loadTeams();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single team
router.get('/:id', (req, res) => {
  try {
    const teams = loadTeams();
    const team = teams.find(t => t.id === req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new team
router.post('/', (req, res) => {
  try {
    const teams = loadTeams();
    const newTeam = {
      id: `team-${Date.now()}`,
      ...req.body,
      createdDate: new Date().toISOString()
    };
    teams.push(newTeam);
    res.status(201).json(newTeam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
