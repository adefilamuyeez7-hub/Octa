import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const chatHistoryPath = path.join(__dirname, '../data/chat-history.json');

// Load chat history
function loadChatHistory() {
  try {
    const data = fs.readFileSync(chatHistoryPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save chat history
function saveChatHistory(history) {
  try {
    fs.writeFileSync(chatHistoryPath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error saving chat history:', err);
  }
}

// Log chat message
router.post('/log', (req, res) => {
  try {
    const { input, output, category, pattern, employeeId, employeeName } = req.body;

    if (!input || !output) {
      return res.status(400).json({ error: "Input and output are required" });
    }

    const history = loadChatHistory();
    const chatEntry = {
      id: `chat_${Date.now()}`,
      timestamp: new Date().toISOString(),
      input,
      output,
      category: category || "general",
      pattern: pattern || "unknown",
      employeeId: employeeId || null,
      employeeName: employeeName || null,
      feedbackScore: null,
      isHelpful: null
    };

    history.push(chatEntry);
    saveChatHistory(history);

    res.json({
      success: true,
      chatId: chatEntry.id
    });
  } catch (error) {
    console.error('Error logging chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat history for employee
router.get('/employee/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    const history = loadChatHistory();
    
    const employeeChats = history.filter(c => c.employeeId === employeeId);
    
    res.json({
      employeeId,
      totalChats: employeeChats.length,
      recentChats: employeeChats.slice(-10),
      conversationContext: employeeChats.slice(-20).map(c => ({
        role: "user",
        content: c.input
      }))
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all chat history
router.get('/', (req, res) => {
  try {
    const history = loadChatHistory();
    res.json({
      totalChats: history.length,
      chats: history.slice(-50)
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rate chat helpfulness
router.put('/:chatId/feedback', (req, res) => {
  try {
    const { chatId } = req.params;
    const { isHelpful, score } = req.body;

    const history = loadChatHistory();
    const chat = history.find(c => c.id === chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.isHelpful = isHelpful;
    chat.feedbackScore = score || null;
    
    saveChatHistory(history);

    res.json({ success: true, message: "Feedback recorded" });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
