require('dotenv').config();
const Chat = require("./model");
const llmService = require("./services/llmService");

const handleChat = async (req, res) => {
  const { message, model, chatId } = req.body;
  console.log("Message:", message, "Model:", model, "ChatId:", chatId);
  
  try {
    let chat = null;
    let history = [];

    if (chatId) {
      chat = await Chat.findById(chatId);
      if (chat) {
        history = chat.messages || [];
        chat.messages.push({ role: "user", content: message, model: model });
        await chat.save();
      }
    } else {
      chat = new Chat({
        title: message.substring(0, 50),
        messages: [{ role: "user", content: message, model: model }]
      });
      await chat.save();
    }

    // Use modular service
    const aiText = await llmService.getAIResponse(model, message, history);

    if (chat) {
      chat.messages.push({ role: "assistant", content: aiText, model: model });
      await chat.save();
    }

    res.status(200).json({
      reply: aiText,
      chatId: chat ? chat._id : null
    });

  } catch (error) {
    console.error("API ERROR:", error.message);
    const isQuotaError = error.message.includes("429") || error.message.includes("quota") || error.status === 429;
    
    res.status(isQuotaError ? 429 : 500).json({
      message: isQuotaError ? "Too Many Requests" : "Error handling chat",
      reply: isQuotaError 
        ? "<p><strong>Busy Signal:</strong> The AI is receiving too many messages right now. Please wait 30 seconds and try again.</p>"
        : `<p><strong>Error:</strong> ${error.message}</p>`
    });
  }
};

const renderPage1 = async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 }).limit(20);
    res.render("screen1", { chats });
  } catch (err) {
    res.render("screen1", { chats: [] });
  }
};

const renderPage2 = async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 }).limit(20);
    res.render("screen2", { chats, message: "", model: "gemini-2.5-flash", chatId: null, history: [] });
  } catch (err) {
    res.render("screen2", { chats: [], message: "", model: "gemini-2.5-flash", chatId: null, history: [] });
  }
};

const createChat = async (req, res) => {
  const { message, model } = req.body;
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 }).limit(20);
    res.render("screen2", {
      message: message, 
      model: model,
      chatId: null,
      history: [],
      chats: chats
    });
  } catch (err) {
    res.render("screen2", { message: message, model: model, chatId: null, history: [], chats: [] });
  }
};

const loadChatPage = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const chat = await Chat.findById(chatId);
    const chats = await Chat.find().sort({ updatedAt: -1 }).limit(20);

    if (!chat) return res.status(404).send("Chat not found");

    res.render("screen2", { 
      chatId: chat._id, 
      history: chat.messages, 
      model: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].model : "gemini-2.5-flash",
      message: null,
      chats: chats
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading chat");
  }
};

module.exports = {
  handleChat,
  renderPage1,
  renderPage2,
  createChat,
  loadChatPage
};
