import { JsonRpcClient } from "../../json-rpc/lib/client";
import { JsonRpcServer } from "../../json-rpc/lib/server";
import { TcpServer, TcpClient, Address, JsonRpcResponse } from "../../json-rpc/lib/transport";
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
        private _nodeAddressList = new Array<string>,
        private _leaderAddr: string | null = null
    ) {
        this.rpcServer = JsonRpcServer.listen({
            transport: new TcpServer(this._parseAddress(_address))
        });

        this._currentState = NodeState.Follower;
        this._registerMethods();
    }

    public async requestAddingNewNode(addr: string): Promise<void> {
        await this._broadcast("add_node", [addr]);
        
        const data = {
            ledger: this._ledger.findMany({}),
            clients: [...this._nodeAddressList, this.address],
            leaderAddr: this._leaderAddr    
        };

        this._nodeAddressList.push(addr);

        const rpcClient = this._establishConnection(addr);
        rpcClient.notify("request_data", [data]);
    }

    public async requestPublishingEvent(
        { address, message }: MessageData
    ): Promise<JsonRpcResponse[]> {
        try {
            await this._saveNewEvent(address, message);
            return this._broadcast("add_event", [address, message]);
        } catch (error) {
            console.error("Error in _saveNewEvent:", error);
            throw error;
        }
    }
    

    public kill(): void {
        console.log(chalk.red(`Killing node on ${this.address}`));
        this.rpcServer.close();
    }

    private _registerMethods(): void {
        this.rpcServer.expose("add_event", this._saveNewEvent.bind(this));
        this.rpcServer.expose("add_node", this._saveNewNode.bind(this));
        this.rpcServer.expose("request_data", this._downloadRequestedData.bind(this));
    }

    /**
     *  HANDLERS 
     */

    private _downloadRequestedData(data: DownloadData): void {
        this._ledger = new EventStore(data.ledger);
        this._leaderAddr = data.leaderAddr;
        data.clients.forEach(address => this._nodeAddressList.push(address));
    }

    private _saveNewNode(addr: string): void {
        this._nodeAddressList.push(addr);
    }

    private _saveNewEvent(address: string, messageEvent: Message): Promise<void> {
        console.log("Me", this._address);
        console.log("Recieved", address);
        console.log("list: ", this.addresses);
        const addressBookContains = this._nodeAddressList.includes(address);
        const notSameAddress = address !== this.address;

        if(!addressBookContains && notSameAddress) {
            throw new Error("Recieved request from unknown node");
        }
        return this._ledger.add(messageEvent);
    }

    private _broadcast(eventType: string, params?: any[]): Promise<JsonRpcResponse[]> {
        const promises = this._nodeAddressList.map(addr => {
            const client = this._establishConnection(addr);
            return client.call(eventType, params);
        });
        return Promise.all(promises);
    }

    private _establishConnection(addr: string): JsonRpcClient {
        return JsonRpcClient.connect({
            transport: new TcpClient(this._parseAddress(addr))
        });
    }

    private _parseAddress(addr: string): Address {
        const [host, port] = addr.split(":");
        return { host, port: +port };
    }

    /**
     * GETTERS
     */

    public get ledger(): Message[] {
        return this._ledger.findMany({});
    }
    public get address(): string {
        return this._address;
    }
    public get addresses(): string[] {
        return this._nodeAddressList;
    }
}