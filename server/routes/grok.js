import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const chatHistoryPath = path.join(__dirname, '../data/chat-history.json');
const knowledgeBasePath = path.join(__dirname, '../data/knowledge-base.json');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCA5Tde7M0VsEDFyuC2NUPirlbe6e_6Cj0';

function loadKnowledgeBase() {
  try {
    const data = fs.readFileSync(knowledgeBasePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading knowledge base:', err);
    return { categories: {} };
  }
}

function loadChatHistory() {
  try {
    const data = fs.readFileSync(chatHistoryPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveChatHistory(history) {
  try {
    fs.writeFileSync(chatHistoryPath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error saving chat history:', err);
  }
}

// Fallback local matching function
function findLocalMatch(userInput) {
  const kb = loadKnowledgeBase();
  const input = userInput.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [categoryName, category] of Object.entries(kb.categories)) {
    if (!category.responses) continue;
    for (const responseObj of category.responses) {
      for (const pattern of responseObj.patterns) {
        const patternWords = pattern.toLowerCase().split(' ');
        const matchedWords = patternWords.filter(word => input.includes(word));
        const score = matchedWords.length / patternWords.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            response: responseObj.response,
            category: categoryName,
            pattern: pattern,
            score: score
          };
        }
      }
    }
  }
  return bestMatch;
}

// Call Google Gemini API
async function callGemini(input, employeeName = null) {
  try {
    const systemContext = employeeName 
      ? `You are an HR Assistant AI helping ${employeeName}. You're part of the OCTA HR system. Be helpful, professional, and concise. Focus on HR, payroll, performance, and task management topics.`
      : `You are an HR Assistant AI for the OCTA HR system. You're helping with HR-related queries, payroll, performance tracking, and task management. Be helpful, professional, and concise.`;

    const chatHistory = loadChatHistory();
    const recentChats = chatHistory
      .filter(c => !employeeName || c.employeeName === employeeName)
      .slice(-5);

    const contents = [];
    
    recentChats.forEach(chat => {
      contents.push({ role: 'user', parts: [{ text: chat.input }] });
      contents.push({ role: 'model', parts: [{ text: chat.output }] });
    });

    contents.push({ role: 'user', parts: [{ text: `${systemContext}\n\nUser query: ${input}` }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data.error?.message);
      throw new Error(data.error?.message || 'Gemini API failed');
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('No response from Gemini');
  } catch (error) {
    console.error('Gemini failed, using fallback:', error.message);
    throw error;
  }
}

// AI response endpoint
router.post('/', async (req, res) => {
  try {
    const { input, employeeId, employeeName } = req.body;

    if (!input || input.trim().length === 0) {
      return res.status(400).json({ error: "Input field is required" });
    }

    console.log("Processing user input:", input);

    let result;
    let category = 'gemini';
    let pattern = 'direct';

    // Try Gemini first
    try {
      result = await callGemini(input, employeeName);
    } catch (error) {
      // Fallback to local matching
      console.log('Gemini unavailable, using local AI');
      const match = findLocalMatch(input);
      if (match) {
        result = match.response;
        category = match.category;
        pattern = match.pattern;
      } else {
        result = `I understood you're asking: "${input}"\n\nI'm still learning! Here's what I can help with:\n\n📋 **Payroll** - Tax calculations, salary reports\n👥 **Employees** - Staff info, onboarding\n✅ **Tasks** - Create and manage work items\n📊 **Performance** - Team metrics and reviews\n\nTry asking about payroll, employees, tasks, or performance!`;
        category = 'general';
        pattern = 'fallback';
      }
    }

    // Log chat to history
    const chatHistory = loadChatHistory();
    chatHistory.push({
      id: `chat_${Date.now()}`,
      timestamp: new Date().toISOString(),
      input,
      output: result,
      category: category,
      pattern: pattern,
      employeeId: employeeId || null,
      employeeName: employeeName || null,
      feedbackScore: null
    });
    saveChatHistory(chatHistory);

    res.json({
      result,
      metadata: {
        category: category,
        pattern: pattern,
        confidence: category === 'gemini' ? 95 : 50
      }
    });
  } catch (error) {
    console.error("AI Engine error:", error);
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

export default router;

