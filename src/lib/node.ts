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

export class Node {

    private _port!: number;
    private _currentState: NodeState;

    private rpcServer!: JsonRpcServer;
    private rpcClient!: JsonRpcClient;
    private readonly _nodeAddresses: Array<string>;
    private readonly _ledger: EventStore<MessageEvent>;

    public constructor() {
        this._nodeAddresses = [];
        this._ledger = new EventStore();
        this._currentState = NodeState.Follower;
    }

    public start(port: number) {
        console.log(chalk.green(`Starting node on ${port}`));
        this._port = port;
        const hostOptions = { 
            hostname: "localhost",
            port
        };
        this.rpcServer = JsonRpcServer.run({
            transport: TcpServer.run(hostOptions)
        });
        this.rpcClient = JsonRpcClient.connect({
            transport: TcpClient.connect(hostOptions)
        });
    }

    public kill() {
        console.log(chalk.red(`Killing node on ${this._port}`));
        this.rpcClient.close();
        this.rpcServer.close();
    }

    public publish(message: MessageEvent) {}

    public displayLedger(message: string, limit = 0, offset = 0) {
        const result = this._ledger.findMany({ limit, offset });
        console.log(chalk.blue(`${message}:`), result);
    }

    public becomeLeader() {
        this._currentState = NodeState.Leader;
        console.log(chalk.yellow("Becoming Leader"));
    }

    public becomeFollower() {
        this._currentState = NodeState.Follower;
        console.log(chalk.yellow("Becoming Follower"));
    }

    public becomeCandidate() {
        this._currentState = NodeState.Candidate;
        console.log(chalk.yellow("Becoming Candidate"));
    }

    public sendHeartbeats() {

    }
}
