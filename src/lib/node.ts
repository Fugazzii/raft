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
        console.log(chalk.green(`Starting node on ${_port}`));
        this.listen(_port);
    }

    public join(port: number) {
        const newNode = new Node(port, this._ledger, this._rpcClients);
        
        this._handleAddNode(port);
        this._rpcClients.map(async c => {
            await c.notify("add_node", [port]);
        });
        return newNode;
    }

    public listen(port: number) {
        const hostOptions = { 
            hostname: "localhost",
            port
        };
        
        this.rpcServer = JsonRpcServer.run({
            transport: TcpServer.run(hostOptions)
        });

        this._registerMethods();
    }

    public kill() {
        console.log(chalk.red(`Killing node on ${this._port}`));
        this.rpcServer.close();
    }

    public async publish(message: MessageEvent) {
        this._rpcClients.map(async c => {
            await c.notify("add_event", [message])
        });
    }

    public getLedger() {
        return this._ledger.findMany({});
    }

    private _registerMethods() {
        this.rpcServer.addMethod("add_event", (messageEvent: MessageEvent) => {
            this._ledger.add(messageEvent);
            return null;
        });
        
        this.rpcServer.addMethod("add_node", this._handleAddNode.bind(this));
    }

    private _handleAddNode(port: number) {
        const client = JsonRpcClient.connect({
            transport: TcpClient.connect({ hostname, port })
        });
        this._rpcClients.push(client);
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
