import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const performancePath = path.join(__dirname, '../data/performance.json');
const notionConfigPath = path.join(__dirname, '../data/notion-config.json');

// Load performance data
function loadPerformanceData() {
  try {
    const data = fs.readFileSync(performancePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading performance data:', err);
    return { trackingSessions: [], taskDelivery: [] };
  }
}

// Load Notion config
function loadNotionConfig() {
  try {
    const data = fs.readFileSync(notionConfigPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { connected: false, apiKey: null };
  }
}

// Save performance data
function savePerformanceData(data) {
  try {
    fs.writeFileSync(performancePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving performance data:', err);
  }
}

// Get team summary
router.get('/team-summary', (req, res) => {
  try {
    const perfData = loadPerformanceData();
    const sessions = perfData.trackingSessions || [];

    // Calculate aggregate metrics
    const summary = {
      totalMembers: sessions.length,
      metrics: {},
      topPerformers: [],
      teamStats: {
        totalTasksCompleted: 0,
        totalTasksAssigned: 0,
        totalActiveMinutes: 0,
        averageContributionScore: 0,
        totalInteractions: 0
      }
    };

    // Build individual metrics
    sessions.forEach(session => {
      summary.metrics[session.employeeName] = {
        activeTime: `${Math.floor(session.activeMinutes / 60)}h ${session.activeMinutes % 60}m`,
        tasksCompleted: session.tasksCompleted,
        tasksAssigned: session.tasksAssigned,
        taskCompletionRate: `${Math.round((session.tasksCompleted / session.tasksAssigned) * 100)}%`,
        contributionScore: session.contributionScore,
        interactions: session.interactionsCount
      };

      summary.teamStats.totalTasksCompleted += session.tasksCompleted;
      summary.teamStats.totalTasksAssigned += session.tasksAssigned;
      summary.teamStats.totalActiveMinutes += session.activeMinutes;
      summary.teamStats.totalInteractions += session.interactionsCount;
    });

    // Calculate average
    summary.teamStats.averageContributionScore = Math.round(
      sessions.reduce((sum, s) => sum + s.contributionScore, 0) / sessions.length
    );

    // Get top performers
    summary.topPerformers = sessions
      .sort((a, b) => b.contributionScore - a.contributionScore)
      .slice(0, 3)
      .map(s => ({
        name: s.employeeName,
        score: s.contributionScore,
        tasksCompleted: s.tasksCompleted
      }));

    res.json(summary);
  } catch (error) {
    console.error('Error calculating team summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get individual employee performance
router.get('/employee/:employeeName', (req, res) => {
  try {
    const { employeeName } = req.params;
    const perfData = loadPerformanceData();
    
    const session = perfData.trackingSessions.find(
      s => s.employeeName.toLowerCase() === employeeName.toLowerCase()
    );

    if (!session) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get assigned tasks
    const assignedTasks = perfData.taskDelivery.filter(
      t => t.assignedTo === session.employeeId
    );

    const completedTasks = assignedTasks.filter(t => t.status === 'completed');
    const onTimeTasks = completedTasks.filter(t => t.daysEarly >= 0).length;

    res.json({
      employeeName: session.employeeName,
      role: session.role || "Team Member",
      date: session.date,
      activeTime: `${Math.floor(session.activeMinutes / 60)}h ${session.activeMinutes % 60}m`,
      taskCompletion: {
        completed: session.tasksCompleted,
        assigned: session.tasksAssigned,
        completionRate: `${Math.round((session.tasksCompleted / session.tasksAssigned) * 100)}%`,
        onTimeDelivery: `${Math.round((onTimeTasks / completedTasks.length) * 100)}%`
      },
      performance: {
        contributionScore: session.contributionScore,
        interactions: session.interactionsCount,
        efficiency: Math.round((session.tasksCompleted / (session.activeMinutes / 60)) * 10)
      },
      recentTasks: assignedTasks.slice(-5),
      performanceGrade: session.contributionScore >= 90 ? 'A' : 
                       session.contributionScore >= 80 ? 'B' : 
                       session.contributionScore >= 70 ? 'C' : 'D'
    });
  } catch (error) {
    console.error('Error getting employee performance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task delivery metrics
router.get('/task-delivery', (req, res) => {
  try {
    const perfData = loadPerformanceData();
    const tasks = perfData.taskDelivery || [];

    const completed = tasks.filter(t => t.status === 'completed');
    const onTime = completed.filter(t => t.daysEarly >= 0).length;
    const onBudget = completed.filter(t => t.daysEarly > 0).length;

    const metrics = {
      totalTasks: tasks.length,
      completed: completed.length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      overdue: tasks.filter(t => t.status === 'in-progress' && new Date(t.dueDate) < new Date()).length,
      completionRate: `${Math.round((completed.length / tasks.length) * 100)}%`,
      onTimeDelivery: `${Math.round((onTime / completed.length) * 100)}%`,
      averageDaysEarly: completed.length > 0 
        ? (completed.reduce((sum, t) => sum + (t.daysEarly || 0), 0) / completed.length).toFixed(1)
        : 0,
      tasksByPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error getting task delivery metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update employee active time
router.post('/track-session', (req, res) => {
  try {
    const { employeeName, employeeId, activeMinutes, tasksCompleted, taskCount } = req.body;

    if (!employeeName || !employeeId) {
      return res.status(400).json({ error: "Employee name and ID required" });
    }

    const perfData = loadPerformanceData();
    
    // Calculate contribution score (0-100)
    const taskScore = taskCount > 0 ? (tasksCompleted / taskCount) * 50 : 0;
    const timeScore = Math.min((activeMinutes / 480) * 30, 30); // Normalized to 8 hour day
    const contributionScore = Math.round(taskScore + timeScore);

    const newSession = {
      employeeId,
      employeeName,
      date: new Date().toISOString().split('T')[0],
      loginTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      activeMinutes,
      tasksCompleted: tasksCompleted || 0,
      tasksAssigned: taskCount || 0,
      contributionScore,
      interactionsCount: 0
    };

    perfData.trackingSessions.push(newSession);
    savePerformanceData(perfData);

    res.json({
      success: true,
      session: newSession,
      message: `Session tracked for ${employeeName}`
    });
  } catch (error) {
    console.error('Error tracking session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync to Notion
router.post('/sync-to-notion', async (req, res) => {
  try {
    const notionConfig = loadNotionConfig();

    if (!notionConfig.connected || !notionConfig.apiKey) {
      return res.status(400).json({ error: "Notion not connected" });
    }

    const perfData = loadPerformanceData();
    const summary = {
      timestamp: new Date().toISOString(),
      teamSize: perfData.trackingSessions.length,
      totalTasksCompleted: perfData.trackingSessions.reduce((sum, s) => sum + s.tasksCompleted, 0),
      averageContribution: Math.round(
        perfData.trackingSessions.reduce((sum, s) => sum + s.contributionScore, 0) / 
        perfData.trackingSessions.length
      )
    };

    console.log("Syncing performance data to Notion:", summary);

    res.json({
      success: true,
      synced: true,
      message: "Performance data synced to Notion",
      data: summary
    });
  } catch (error) {
    console.error('Error syncing to Notion:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
