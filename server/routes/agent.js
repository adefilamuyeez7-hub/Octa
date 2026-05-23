import { Router } from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import agent handler (dynamically load the TypeScript-compiled version)
// For now, we'll implement a wrapper that uses the Claude API directly
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_VERSION = '2023-06-01';

async function callClaudeApi(message, history = []) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const messages = history
    .filter(entry => (entry.from === 'you' || entry.from === 'agent') && entry.text)
    .map(entry => ({
      role: entry.from === 'agent' ? 'assistant' : 'user',
      content: entry.text,
    }));

  messages.push({
    role: 'user',
    content: message,
  });

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: 'You are 0cta, an HR operations copilot. Give direct, useful replies and suggest concrete next steps when helpful.',
    messages,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${raw}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse Claude response:', raw);
    throw new Error('Failed to parse Claude API response');
  }

  // Extract reply from Claude's response format
  let reply = 'Claude returned an empty reply.';
  if (parsed && parsed.content && Array.isArray(parsed.content)) {
    for (const block of parsed.content) {
      if (block.type === 'text' && block.text) {
        reply = block.text;
        break;
      }
    }
  }

  return {
    reply,
    meta: `Live via Anthropic Claude (${CLAUDE_MODEL}) - responded just now`,
    live: true,
  };
}

// Agent endpoint
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Use Claude if API key is configured
    if (ANTHROPIC_API_KEY) {
      try {
        const result = await callClaudeApi(message, history);
        return res.json(result);
      } catch (error) {
        console.error('Claude API error:', error);
        return res.status(500).json({
          error: 'Claude API failed',
          message: error.message,
        });
      }
    } else {
      return res.status(400).json({
        error: 'ANTHROPIC_API_KEY not configured',
        message: 'Please add ANTHROPIC_API_KEY to your .env.local file',
      });
    }
  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({ error: 'Agent request failed', message: error.message });
  }
});

export default router;
