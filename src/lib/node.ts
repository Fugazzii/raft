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

type MessageData = {
    address: string;
    message: Message;
};

type DownloadData = {
    ledger: Message[];
    clients: string[];
    leaderAddr: string;
};

export class Node {
    private rpcServer!: JsonRpcServer;
    private _currentState: NodeState;

    public constructor(
        private readonly _address: string,
        private _ledger = new EventStore(),
        private _rpcClients = new Map<string, JsonRpcClient>(),
        private _leaderAddr: string | null = null
    ) {
        this.rpcServer = JsonRpcServer.listen({
            transport: new TcpServer(this._parseAddress(_address))
        });

        this._registerMethods();
        
        this._currentState = NodeState.Follower;
    }

    public async requestAddingNewNode(addr: string) {
        await this._broadcast("add_node", addr);       
        
        const data = {
            ledger: this._ledger.findMany({}),
            clients: [...this.clients, this.address],
            leaderAddr: this._leaderAddr    
        };

        const rpcClient = this._handleNewNode(addr);
        this._rpcClients.set(addr, rpcClient);

        const res = await this._rpcClients.get(addr)?.call("request_data", data);
        return {
            ok: true,
            data: res?.result 
        };
    }

    public async requestPublishingEvent({ address, message }: MessageData) {
        try {
            await this._handleNewEvent(address, message);
            return this._broadcast("add_event", address, message);
        } catch (error) {
            console.error("Error in _handleNewEvent:", error);
            throw error;
        }
    }
    

    public kill() {
        console.log(chalk.red(`Killing node on ${this.address}`));
        this.rpcServer.close();
    }

    private _registerMethods() {
        this.rpcServer.expose("add_event", this._handleNewEvent.bind(this));
        this.rpcServer.expose("add_node", this._handleNewNode.bind(this));
        this.rpcServer.expose("request_data", this._handleRequestData.bind(this));
    }

    /**
     *  HANDLERS 
     */

    private _handleRequestData(data: DownloadData) {
        this._ledger = new EventStore(data.ledger);
        data.clients.forEach(address => {
            this._rpcClients.set(
                address,
                this._handleNewNode(address)
            );
        });
        this._leaderAddr = data.leaderAddr;
    }

    private _handleNewNode(addr: string) {
        const client = JsonRpcClient.connect({
            transport: new TcpClient(this._parseAddress(addr))
        });
        this._rpcClients.set(addr, client);
        return client;
    }

    private async _handleNewEvent(address: string, messageEvent: Message) {
        const { port, host } = this._parseAddress(address);

        if(!this._rpcClients.get(address) && `${host}:${port}` !== this.address) {
            throw new Error("Recieved request from unknown node");
        }
        await this._ledger.add(messageEvent);
    }

    private _broadcast(eventType: string, ...params: any) {
        const promises = Array.from(this._rpcClients.values())
            .map(c => c.call(eventType, ...params));
        return Promise.all(promises);
    }

    private _parseAddress(addr: string) {
        const [host, port] = addr.split(":");
        return { host, port: +port };
    }

    /**
     * GETTERS
     */

    public get ledger() {
        return this._ledger.findMany({});
    }
    public get address() {
        return this._address;
    }
    public get clients() {
        return Array.from(this._rpcClients.keys());
    }
}