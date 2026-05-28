const { GoogleGenAI } = require("@google/genai");
const OpenAI = require("openai");

// Initialize Clients
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const openRouterClient = new OpenAI({
  apiKey: process.env.openroute_key,
  baseURL: "https://openrouter.ai/api/v1"
});

const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

/**
 * Modular Service to get AI responses from different providers
 */
const getAIResponse = async (model, message, history) => {
  const systemInstruction = `
    You are a helpful assistant. 
    Answer the following question using HTML tags (like <p>, <ul>, <li>, <strong>, <h3>). 
    Do NOT wrap the answer in markdown code blocks (like \`\`\`html). 
    Just give the raw HTML string.
  `;

  try {
    if (model === "gemini-2.5-flash") {
      const contents = history.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      contents.push({ role: "user", parts: [{ text: systemInstruction + "\n\nQuestion: " + message }] });

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });

      return response.text;

    } else if (model === "openrouter") {
      const messages = history.map(m => ({
        role: m.role,
        content: m.content
      }));
      messages.unshift({ role: "system", content: systemInstruction });
      messages.push({ role: "user", content: message });

      const response = await openRouterClient.chat.completions.create({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: messages
      });
      return response.choices[0].message.content;

    } else if (model === "groq") {
      const messages = history.map(m => ({
        role: m.role,
        content: m.content
      }));
      messages.unshift({ role: "system", content: systemInstruction });
      messages.push({ role: "user", content: message });

      const response = await groqClient.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: messages
      });
      return response.choices[0].message.content;
    }

    throw new Error("Unsupported model: " + model);
  } catch (error) {
    console.error(`LLM Service Error (${model}):`, error.message);
    throw error;
  }
};

module.exports = {
  getAIResponse
};
