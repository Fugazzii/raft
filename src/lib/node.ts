import { deepEquals } from "bun";
import { JsonRpcClient } from "../../json-rpc/lib/rpc-client";
import { JsonRpcServer } from "../../json-rpc/lib/rpc-server";
import { TcpClient, TcpServer } from "../../json-rpc/lib/transport";
import { EventStore } from "./event-store";
import { Message } from "./message-event";
import chalk from 'chalk';

enum NodeState {
    Candidate,
    Follower,
    Leader
}

const hostname = "localhost";

export class Node {
    private rpcServer!: JsonRpcServer;
    private _currentState: NodeState;

    public constructor(
        private readonly _port: number,
        private readonly _ledger = new EventStore(),
        private readonly _rpcClients: JsonRpcClient[] = [],
        private _leaderIndex = 0
    ) {
        this.rpcServer = JsonRpcServer.run({
            transport: TcpServer.run({ hostname, port: _port })
        });

        this._registerMethods();
        
        this._currentState = NodeState.Follower;
    }

    public async addNode(port: number) {
        const copyClients = [...this._rpcClients];
        const newNode = new Node(port, this._ledger, copyClients);
        
        this._handleAddNode(port);
        await this._broadcast("add_node", [port]);

        return newNode;
    }

    public addEvent(message: Message) {
        this._ledger.add(message);
        return this._broadcast("add_event", [message]);
    }

    public kill() {
        console.log(chalk.red(`Killing node on ${this._port}`));
        this.rpcServer.close();
    }

    private _registerMethods() {
        this.rpcServer.addMethod("add_event", this._handleAddEvent.bind(this));
        this.rpcServer.addMethod("add_node", this._handleAddNode.bind(this));
    }

    private _handleAddEvent(messageEvent: Message) {
        this._ledger.add(messageEvent);
        return null;
    }
    private _handleAddNode(port: number) {
        const client = JsonRpcClient.connect({
            transport: TcpClient.connect({ hostname, port })
        });
        this._rpcClients.push(client);
    }

    private _broadcast(eventType: string, params: unknown[] = []) {
        const promises = this._rpcClients.map(c => {
            return c.call(eventType, params);
        });
        return Promise.all(promises);        
    }

    public get ledger() {
        return this._ledger.findMany({});
    }
    public get port() {
        return this._port;
    }
}