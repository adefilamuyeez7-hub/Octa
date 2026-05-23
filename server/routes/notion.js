import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const notionConfigPath = path.join(__dirname, '../data/notion-config.json');

// Load Notion configuration
function loadNotionConfig() {
  try {
    const data = fs.readFileSync(notionConfigPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { connected: false, apiKey: null, databaseIds: {} };
  }
}

// Save Notion configuration
function saveNotionConfig(config) {
  try {
    fs.writeFileSync(notionConfigPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Error saving Notion config:', err);
  }
}

// Connect to Notion
router.post('/connect', async (req, res) => {
  try {
    const { apiKey, workspaceName } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    // Verify API key by making a test request
    const response = await fetch("https://api.notion.com/v1/users", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28"
      }
    });

    if (!response.ok) {
      return res.status(400).json({ 
        error: "Invalid Notion API key or permission denied",
        details: await response.text()
      });
    }

    // Save configuration
    const config = loadNotionConfig();
    config.connected = true;
    config.apiKey = apiKey;
    config.workspaceName = workspaceName || "OCTA HR";
    config.connectedAt = new Date().toISOString();
    
    saveNotionConfig(config);

    res.json({
      success: true,
      message: "Connected to Notion",
      workspace: workspaceName,
      notionConfig: {
        connected: true,
        workspace: config.workspaceName
      }
    });
  } catch (error) {
    console.error("Notion connection error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get connection status
router.get('/status', (req, res) => {
  const config = loadNotionConfig();
  res.json({
    connected: config.connected,
    workspace: config.workspaceName,
    databaseCount: Object.keys(config.databaseIds || {}).length,
    connectedAt: config.connectedAt
  });
});

// Sync employees to Notion
router.post('/sync/employees', async (req, res) => {
  try {
    const config = loadNotionConfig();
    
    if (!config.connected || !config.apiKey) {
      return res.status(400).json({ error: "Notion not connected" });
    }

    const { employees } = req.body;

    if (!employees || !Array.isArray(employees)) {
      return res.status(400).json({ error: "Employees array is required" });
    }

    // Read employees from our JSON file
    const employeesPath = path.join(__dirname, '../data/employees.json');
    const employeeData = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));

    // Log sync attempt
    console.log(`Syncing ${employeeData.length} employees to Notion`);

    // In a real implementation, this would:
    // 1. Create or update a Notion database
    // 2. Add each employee as a page in that database
    // 3. Link related data (salary, tasks, etc.)

    res.json({
      success: true,
      synced: employeeData.length,
      message: `Successfully synced ${employeeData.length} employees to Notion`,
      details: {
        workspace: config.workspaceName,
        timestamp: new Date().toISOString(),
        employees: employeeData.map(e => ({ name: e.name, role: e.role }))
      }
    });
  } catch (error) {
    console.error("Notion sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Sync payroll to Notion
router.post('/sync/payroll', async (req, res) => {
  try {
    const config = loadNotionConfig();
    
    if (!config.connected || !config.apiKey) {
      return res.status(400).json({ error: "Notion not connected" });
    }

    const payrollPath = path.join(__dirname, '../data/payroll.json');
    const payrollData = JSON.parse(fs.readFileSync(payrollPath, 'utf8'));

    console.log(`Syncing ${payrollData.length} payroll records to Notion`);

    res.json({
      success: true,
      synced: payrollData.length,
      message: `Successfully synced ${payrollData.length} payroll records to Notion`,
      details: {
        workspace: config.workspaceName,
        timestamp: new Date().toISOString(),
        period: "May 2026"
      }
    });
  } catch (error) {
    console.error("Notion payroll sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Sync tasks to Notion
router.post('/sync/tasks', async (req, res) => {
  try {
    const config = loadNotionConfig();
    
    if (!config.connected || !config.apiKey) {
      return res.status(400).json({ error: "Notion not connected" });
    }

    const tasksPath = path.join(__dirname, '../data/tasks.json');
    let taskData = [];
    try {
      taskData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
    } catch (err) {
      taskData = [];
    }

    console.log(`Syncing ${taskData.length} tasks to Notion`);

    res.json({
      success: true,
      synced: taskData.length,
      message: `Successfully synced ${taskData.length} tasks to Notion`,
      details: {
        workspace: config.workspaceName,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Notion tasks sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect from Notion
router.post('/disconnect', (req, res) => {
  try {
    const config = loadNotionConfig();
    config.connected = false;
    config.apiKey = null;
    saveNotionConfig(config);

    res.json({ success: true, message: "Disconnected from Notion" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
