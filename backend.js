const express=require("express");
const app= express();
const path=require("path");
app.use(express.static("public"));
app.use(express.json());
app.listen(3000);

app.get("/formpage",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","index.html"))
})

app.post("/form",(req,res)=>{
    const msg = req.body.message;
    if(!msg){
        return res.status(400).json({ error: "No message sent" });
    }

    res.json({ reply: "Backend received: " + msg });
})
