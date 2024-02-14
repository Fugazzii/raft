import express from "express";
import { Node } from "./lib/node";
import { Message } from "./lib/message-event";

const RPC_PORT = +Bun.argv[2];
const HTTP_PORT = RPC_PORT + 5000;

const genesisNode = new Node(RPC_PORT);

const app = express();

app.use(express.json());

app.get("/ping", (_, res) => res.end("<h1>🚀 Pong!</h1>"));

app.post("/node", async (req, res) => {
    const newNodePort = req.body.port;
    const newNode = await genesisNode.addNode(newNodePort);

    res.status(200).json({
        message: `Added node ${newNodePort} in network`,
        ledger: newNode.ledger
    });
});

app.get("/events", (req, res) => {
    res.status(200).json({
        data: genesisNode.ledger
    })
});

app.post("/event", async (req, res) => {
    const { message } = req.body;
    await genesisNode.addEvent(message);

    res.status(201).json({
        message: "Published message",
        ledger: genesisNode.ledger
    });
});


app.listen(HTTP_PORT, () => console.log(`🚀 Http Server is running on ${HTTP_PORT}`));