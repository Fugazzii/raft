import express from "express";
import { Node } from "./lib/node";
import { MessageEvent } from "./lib/message-event";
import chalk from "chalk";
import { getRandomSeed } from "bun:jsc";

const node1 = new Node(3000);
const node2 = node1.join(3001);
const node3 = node2.join(3002);

const cluster = [node1, node2, node3];

const app = express();

app.use(express.json());

app.get("/ping", (_, res) => res.end("<h1>🚀 Pong!</h1>"));
app.post("/event", async (req, res) => {
    const { message } = req.body;
    const messageEvent = MessageEvent.new(message);
    const randHash = message.length % cluster.length;
    await cluster[randHash].publish(messageEvent);
    res.status(201)
        .json({ message: "Successfully published message" })
        .destroy();
})

app.listen(8000, () => console.log(`🚀 Server is running on 8000`));