require('dotenv').config(); // Load the .env file

const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const chatHistoryStore = {};


const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const { CohereClientV2 } = require('cohere-ai');
const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

const Chat = require("./model")

const handleChat = async (req, res) => {
  const { message, model, chatId } = req.body;
  console.log(message)
  try {
    // TODO: Implement chat logic

    const prompt = `
            You are a helpful assistant. 
            Answer the following question using HTML tags (like <p>, <ul>, <li>, <strong>, <h3>). 
            Do NOT wrap the answer in markdown code blocks (like \`\`\`html). 
            Just give the raw HTML string.
            
            Question: ${message}
        `;

    let aiText = "";
    if (model === "gemini-2.5-flash") {
      console.log("Selected gemini");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });


      console.log("Google Responded:", response ? "Yes" : "No");
      aiText = response.text;


    }

    if (model === "gpt-4o") {
      console.log(process.env.OPENAI_API_KEY)
      const response = await client.responses.create({
        model: "gpt-5.2",
        input: prompt
      });
      aiText = response.output_text;

    }

    if (model === "cohere") {

      console.log("cohere")
      const response = await cohere.chat({
        model: 'command-a-03-2025',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
      aiText = response.message.content[0].text;;
    }
    console.log(aiText);


    // sends to script.js
    res.status(200).json({
      reply: aiText
    });


  } catch (error) {

    console.error("API ERROR:", error.message);

    // 429 too many req
    if (error.message.includes("429") || error.message.includes("quota") || error.status === 429) {
      return res.status(429).json({
        message: "Too Many Requests",
        reply: "<p><strong>Busy Signal:</strong> The AI is receiving too many messages right now. Please wait 30 seconds and try again.</p>"
      });
    }

   
    if (error.message.includes("404") || error.message.includes("not found")) {
      return res.status(500).json({
        message: "Model Error",
        reply: "<p> <strong>Configuration Error:</strong> The selected AI model is not available for this API Key.</p>"
      });
    }
    res
      .status(500)
      .json({ message: "Error handling chat", error: error.message });
  }
};



const renderPage1 = (req, res) => {
  res.render("screen1");
}

const renderPage2 = (req, res) => {
  res.render("screen2");
}

const createChat1 = (req, res) => {
  const { message, model } = req.body;
  res.render("screen2", {
    message: message, model: model
  })
  console.log(req.body);

}


// tried task 2 and mongo

// const createChat =async(req,res)=>{
//   const { message, model } = req.body;
//   try {
//    
//     const newChat = await Chat.create({
//         title: message.substring(0, 50), //50 chars as title
//         messages: [{
//             role: "user",
//             content: message,
//             model: model
//         }]
//     });
//     const newId = newChat._id;
//     // console.log(` Created New Chat: ${newId}`);

//    
//     res.redirect(`/polychat/${newId}`);

//   } catch (error) {
//     console.error("Error creating chat:", error);
//     res.status(500).send("Database Error");
//   }
// }

// const loadChatPage = async (req, res) => {
//     try {
//         
//         const chatId = req.params.chatId;
//         const chat = await Chat.findById(chatId);

//         if (!chat) {
//             return res.status(404).send("Chat not found");
//         }

//         //
//         res.render("screen2", { 
//             chatId: chat._id, 
//             history: chat.messages, 
//             model: "gemini-2.5-flash" 
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).send("error loading chat");
//     }
// };

module.exports = {
  handleChat,
  renderPage1, renderPage2,
  createChat1,
  // loadChatPage
};
