import { JsonRpcClient } from "../../json-rpc/lib/rpc-client";
import { JsonRpcServer } from "../../json-rpc/lib/rpc-server";
import { TcpClient, TcpServer } from "../../json-rpc/lib/transport";
import { EventStore } from "./event-store";
import { MessageEvent } from "./message-event";
import chalk from 'chalk';

enum NodeState {
    Candidate,
    Follower,
    Leader
}

const hostname = "localhost";

export class Node {

    private _currentState: NodeState;

    private rpcServer!: JsonRpcServer;

    public constructor(
        private readonly _port: number,
        private readonly _ledger: EventStore<MessageEvent> = new EventStore(),
        private readonly _rpcClients: JsonRpcClient[] = []
    ) {
        this._currentState = NodeState.Follower;

        this.rpcServer = JsonRpcServer.run({
            transport: TcpServer.run({ hostname, port: _port })
        });

        this._registerMethods();
    }

    public join(port: number) {
        const newNode = new Node(port, this._ledger, this._rpcClients);
        
        this._handleAddNode(port);
        this._rpcClients.map(async c => {
            await c.notify("add_node", [port]);
        });
        return newNode;
    }

    public async publish(message: MessageEvent) {
        this._rpcClients.map(async c => {
            await c.notify("add_event", [message])
        });
    }

    public kill() {
        console.log(chalk.red(`Killing node on ${this._port}`));
        this.rpcServer.close();
    }

    private _registerMethods() {
        this.rpcServer.addMethod("add_event", this._handleAddEvent.bind(this));
        this.rpcServer.addMethod("add_node", this._handleAddNode.bind(this));
    }

    private _handleAddEvent(messageEvent: MessageEvent) {
        this._ledger.add(messageEvent);
        return null;
    }
    private _handleAddNode(port: number) {
        const client = JsonRpcClient.connect({
            transport: TcpClient.connect({ hostname, port })
        });
        this._rpcClients.push(client);
    }

    public get ledger() {
        return this._ledger.findMany({});
    }
    public get port() {
        return this._port;
    }
}



// public becomeLeader() {
//     this._currentState = NodeState.Leader;
//     console.log(chalk.yellow("Becoming Leader"));
// }

// public becomeFollower() {
//     this._currentState = NodeState.Follower;
//     console.log(chalk.yellow("Becoming Follower"));
// }

// public becomeCandidate() {
//     this._currentState = NodeState.Candidate;
//     console.log(chalk.yellow("Becoming Candidate"));
// }

// public sendHeartbeats() {}
