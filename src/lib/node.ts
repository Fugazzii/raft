import { EventStore } from "./event-store";
import { MessageEvent } from "./message-event";

enum NodeState {
    Candidate,
    Follower,
    Leader
}

export class Node {

    private _port!: number;
    private readonly rpcServer: any;
    private readonly rpcClient: any;
    private readonly _nodeAddresses: Array<string>;

    private readonly _ledger: EventStore<MessageEvent>;

    private _currentState: NodeState;

    public constructor() {
        this._nodeAddresses = [];
        this._ledger = new EventStore();
        this._currentState = NodeState.Follower;
    }

    public start(port: number) {
        console.log("Starting node on", port);
        this._port = port;
    }
    public kill() {
        console.log("Killing node on ", this._port);
        process.exit(1);
    }

    public publish(message: MessageEvent) {}

    public displayLedger(message: string, limit = 0, offset = 0) {
        const result = this._ledger.findMany({ limit, offset });
        console.log(message, result);
    }
    
    public becomeLeader() {}
    public becomeFollower() {}
    public becomeCandidate() {}

    public sendHeartbeats() {
        
    }
}