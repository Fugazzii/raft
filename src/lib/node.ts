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
        this._handleNewNode(addr);
        await this._broadcast("add_node", [addr]);
        return {
            ok: true,
            data: {
                ledger: this._ledger.findMany({}),
                clients: Array.from(this._rpcClients.keys()),
                leaderAddr: this._leaderAddr    
            }
        };
    }

    public requestPublishingEvent(message: Message) {
        this._ledger.add(message);
        return this._broadcast("add_event", [message]);
    }

    public kill() {
        console.log(chalk.red(`Killing node on ${this.port}`));
        this.rpcServer.close();
    }

    private _registerMethods() {
        this.rpcServer.addMethod("add_event", this._handleNewEvent.bind(this));
        this.rpcServer.addMethod("add_node", this._handleNewNode.bind(this));
        this.rpcServer.addMethod("request_data", this._handleRequestData.bind(this));
    }

    /**
     *  HANDLERS 
     */

    private _handleRequestData(data: any) {
        this._ledger = data.ledger;
        this._rpcClients = data.clients;
        this._leaderAddr = data.leaderAddr;
    }

    private _handleNewEvent(messageEvent: Message) {
        this._ledger.add(messageEvent);
        console.log(this.port, "Ledger", this.ledger);
    }
    private _handleNewNode(addr: Address) {
        const client = JsonRpcClient.connect({
            transport: TcpClient.connect(addr)
        });
        this._rpcClients.set(addr, client);
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
}