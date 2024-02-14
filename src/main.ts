import express from "express";
import { Node } from "./lib/node";

/**
 * This is variable for simulating friend's endpoint,
 * or somebody's host that is responsible for broadcasting
 * new node addition in the network
 */
const ENDPOINT = "http://localhost:8000/add_node";

/**
 * Retrieving PORT from console
 * ```bun run ./src/main.ts 3000```
 */
const RPC_PORT = +Bun.argv[2];
const HTTP_PORT = RPC_PORT + 5000;

const node = new Node(`localhost:${RPC_PORT}`);

const app = express();

app.use(express.json());

app.get("/ping", (_, res) => res.end("<h1>🚀 Pong!</h1>"));

/**
 * Endpoint for somebody that want's to add other node in network
*/
app.post("/add_node", async (req, res) => {
    try {
        const { url } = req.body;
        const { ok, data } = await node.requestAddingNewNode(url);

        console.log(ok ? "ok" : "not ok");

        res.status(200).json({
            message: `Added node ${req.body.port} in network`,
            data
        });
    } catch(error) {
        res.status(500).json({
            message: "Failed in /add_node",
            error
        });
    }
});

/**
 * As long as we don't have cli tool for directly interacting with network,
 * we can send request through Postman
 */
app.post("/join", async (req, res) => {
    try {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: req.body.url
            })
        });
    
        const data = await response.json();
    
        res.status(201).json({
            message: "Downloaded data",
            data
        });            
    } catch (error) {
        res.status(500).json({
            message: "Failed in /join",
            error
        });
    }
})

/**
 * Fetch all events
 */
app.get("/events", (req, res) => {
    res.status(200).json({
        message: "All events",
        data: node.ledger
    });
});

app.get("/clients", (req, res) => {
    res.status(200).json({
        message: "All clients",
        data: node.clients
    });
})

/**
 * Publish event
 */
app.post("/event", async (req, res) => {
    try {
        const { message } = req.body;
        await node.requestPublishingEvent({ 
            address: "localhost:3000",
            message
        });
    
        res.status(201).json({
            message: "Published message",
            ledger: node.ledger
        });            
    } catch (error) {
        res.status(500).json({
            message: "Failed to publish event",
            error
        });
    }
});

app.listen(HTTP_PORT, () => console.log(`🚀 Http Server is running on ${HTTP_PORT}`));