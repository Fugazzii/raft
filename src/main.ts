import express from "express";
import { Node } from "./lib/node";

const RPC_PORT = +Bun.argv[2];
const HTTP_PORT = RPC_PORT + 5000;

const genesisNode = new Node({
    port: RPC_PORT,
    hostname: "localhost"
});

const app = express();

app.use(express.json());

app.get("/ping", (_, res) => res.end("<h1>🚀 Pong!</h1>"));

/**
 * Used outside the postman
 */
app.post("/add_node", async (req, res) => {
    const { port, hostname } = req.body;
    const { ok, data } = await genesisNode.requestAddingNewNode({
        port,
        hostname
    });

    console.log(ok, data);

    res.status(200).json({
        message: `Added node ${req.body.port} in network`,
        data
    });
});

app.post("/join", async (req, res) => {
    const response = await fetch("http://localhost:8000/add_node", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            port: req.body.port,
            hostname: req.body.hostname
        })
    });

    const data = await response.json();

    res.status(201).json({
        message: "Downloaded data",
        data
    });
})

app.get("/events", (req, res) => {
    res.status(200).json({
        message: "All events",
        data: genesisNode.ledger
    })
});

app.post("/event", async (req, res) => {
    const { message } = req.body;
    await genesisNode.requestPublishingEvent(message);

    res.status(201).json({
        message: "Published message",
        ledger: genesisNode.ledger
    });
});

app.listen(HTTP_PORT, () => console.log(`🚀 Http Server is running on ${HTTP_PORT}`));