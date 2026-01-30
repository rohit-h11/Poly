const express = require("express");
const router = express.Router();
const { handleChat } = require("./controller");
const Controll = require("./controller")
router.post("/chat", handleChat);

router.get("/",Controll.renderPage1);
router.get("/chat",Controll.renderPage2);

// from screen 1 to 2 
// initial code
router.post("/new",Controll.createChat1);


// router.post("/chat",Controll.handleChat)
// router.post("/new",Controll.createChat);

// router.post("/:chatId",Controll.loadChatPage);
module.exports = router;
