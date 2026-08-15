import { answerPublicQuestion } from "../services/publicAiService.js";

const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_MESSAGES = 8;

const cleanMessage = (value) => {
  if (typeof value !== "string") return null;
  const content = value.trim();
  return content && content.length <= MAX_MESSAGE_LENGTH ? content : null;
};

const cleanHistory = (value) => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_MESSAGES) return null;
  const result = [];
  for (const item of value) {
    if (!item || !["user", "assistant"].includes(item.role)) return null;
    const content = cleanMessage(item.content);
    if (!content) return null;
    result.push({ role: item.role, content });
  }
  return result;
};

export async function chatWithPublicAi(req, res) {
  const message = cleanMessage(req.body?.message);
  const history = cleanHistory(req.body?.history);
  if (!message)
    return res.status(400).json({
      message: `Message is required and must be at most ${MAX_MESSAGE_LENGTH} characters.`,
    });
  if (!history)
    return res.status(400).json({
      message: `History must contain at most ${MAX_HISTORY_MESSAGES} valid user or assistant messages.`,
    });

  try {
    const answer = await answerPublicQuestion({ message, history });
    return res.json({
      success: true,
      answer,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error?.status === 429)
      return res.status(503).json({
        message:
          "SOCConsult AI Guide is busy right now. Please try again shortly.",
      });
    return res.status(503).json({
      message:
        "SOCConsult AI Guide is temporarily unavailable. Please try again.",
    });
  }
}
