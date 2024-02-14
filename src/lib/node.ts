import { JsonRpcClient } from "../../json-rpc/lib/rpc-client";
import { JsonRpcServer } from "../../json-rpc/lib/rpc-server";
import { Address, TcpClient, TcpServer } from "../../json-rpc/lib/transport";
import { EventStore } from "./event-store";
import { Message } from "./message-event";
import chalk from 'chalk';

enum NodeState {
    Candidate,
    Follower,
    Leader
}

type MessageData = {
    addr: Address;
    message: Message;
};

type DownloadData = {
    ledger: Message[];
    clients: string[];
    leaderAddr: Address | null;
};

export class Node {
    private rpcServer!: JsonRpcServer;
    private _currentState: NodeState;

    public constructor(
        private readonly _address: Address,
        private _ledger = new EventStore(),
        private _rpcClients = new Map<Address, JsonRpcClient>(),
        private _leaderAddr: Address | null = null
    ) {
        this.rpcServer = JsonRpcServer.run({
            transport: TcpServer.run(_address)
        });

        this._registerMethods();
        
        this._currentState = NodeState.Follower;
    }

    public async requestAddingNewNode(addr: Address) {
        await this._broadcast("add_node", [addr]);
        
        const data = {
            ledger: this._ledger.findMany({}),
            clients: [...this.clients, this.address],
            leaderAddr: this._leaderAddr    
        };

        const rpcClient = this._handleNewNode(addr);
        this._rpcClients.set(addr, rpcClient);

        const res = await this._rpcClients.get(addr)?.call("request_data", [data]);
        return {
            ok: true,
            data: res?.result 
        };
    }

    public async requestPublishingEvent({ addr, message }: MessageData) {
        await this._handleNewEvent(addr, message);
        return this._broadcast("add_event", [addr, message]);
    }

    public kill() {
        console.log(chalk.red(`Killing node on ${this.port}`));
        this.rpcServer.close();
    }

    private _registerMethods() {
        this.rpcServer.addMethod("add_event", this._handleNewEvent.bind(this));
        this.rpcServer.addMethod("add_node", this._handleNewNode.bind(this));
        this.rpcServer.addMethod("request_data", this._handleRequestData.bind(this))
    }

    /**
     *  HANDLERS 
     */

    private _handleRequestData(data: DownloadData) {
        this._ledger = new EventStore(data.ledger);
        data.clients.forEach(_ => {
            const [hostname, port] = _.split(":");
            const addr = { 
                hostname,
                port: +port
            };
            this._rpcClients.set(addr, this._handleNewNode(addr));
        });
        this._leaderAddr = data.leaderAddr;
    }
    private async _handleNewEvent(addr: Address, messageEvent: Message) {
        if(!this._rpcClients.get(addr)) {
            throw new Error("Recieved request from unknown node");
        }
        await this._ledger.add(messageEvent);
    }

    private _handleNewNode(addr: Address) {
        const client = JsonRpcClient.connect({
            transport: TcpClient.connect(addr)
        });
        this._rpcClients.set(addr, client);
        return client;
    }

    private _broadcast(eventType: string, params: unknown[] = []) {
        const promises = Array.from(this._rpcClients.values())
            .map(c => c.call(eventType, params));
        return Promise.all(promises);
    }

    /**
     * GETTERS
     */

    public get ledger() {
        return this._ledger.findMany({});
    }
    public get port() {
        return this._address.port;
    }
    public get host() {
        return this._address.hostname;
    }
    public get address() {
        return `${this.host}:${this.port}`;
    }
    public get clients() {
        return Array.from(this._rpcClients.keys());
    }
}