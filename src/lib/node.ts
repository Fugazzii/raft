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

type DownloadData = {
    downloadingFromAddress: string;
    clients: string[];
    leaderAddr: string | null;
};

export class Node {
    private rpcServer!: JsonRpcServer;
    private _currentState: NodeState;

    private _ledger: EventStore;
    private _nodeAddressList: Array<string>;
    private _leaderAddr: string | null;

    public constructor(private readonly _address: string,) {
        this._currentState = NodeState.Follower;
        this._ledger = new EventStore(_address);
        this._nodeAddressList = [];
        this._leaderAddr = null;
        
        this.rpcServer = JsonRpcServer.listen({
            transport: new TcpServer(this._parseAddress(_address))
        });

        this._registerMethods();
    }

    public async requestAddingNewNode(newNodeAddr: string): Promise<void> {
        await this._broadcast("add_node", [newNodeAddr]);
        
        const data: DownloadData = {
            downloadingFromAddress: this._address,
            clients: this._nodeAddressList,
            leaderAddr: this._leaderAddr
        };

        const rpcClient = this._establishConnection(newNodeAddr);
        const ledger = await this.getledger();
        rpcClient.notify("request_data", [data]);
        rpcClient.notify("request_ledger", [ledger]);
        this._nodeAddressList.push(newNodeAddr);
    }

    public async requestPublishingEvent(messageData: Message): Promise<void> {
        try {
            await this._saveNewEvent(messageData);
            await this._notifyAll("add_event", [messageData]);
        } catch (error) {
            console.error("Error in _saveNewEvent:", error);
            throw error;
        }
    }
    
    private _registerMethods(): void {
        this.rpcServer.expose("add_event", this._saveNewEvent.bind(this));
        this.rpcServer.expose("add_node", this._saveNewNode.bind(this));
        this.rpcServer.expose("request_data", this._downloadRequestedData.bind(this));
        this.rpcServer.expose("request_ledger", this._requestLedger.bind(this));
    }

    /**
     *  HANDLERS 
     */

    private _downloadRequestedData(recievedData: DownloadData): void {
        recievedData.clients.forEach(this._saveNewNode);
        this._nodeAddressList.push(recievedData.downloadingFromAddress);
        this._leaderAddr = recievedData.leaderAddr;
    }

    private _requestLedger(data: Message[]): void {
        this._ledger.update(data);
    }

    private _saveNewNode = (newNodeAddr: string): void => {
        this._nodeAddressList.push(newNodeAddr);
    }

    private _saveNewEvent(messageEvent: Message): Promise<number> {
        return this._ledger.add(messageEvent);
    }

    /**
     * UTILS
     */

    private _broadcast(eventType: string, params?: any[]): Promise<JsonRpcResponse[]> {
        const promises = this._nodeAddressList.map(addr => {
            const client = this._establishConnection(addr);
            return client.call(eventType, params);
        });
        return Promise.all(promises);
    }

    private _notifyAll(eventType: string, params?: any[]): Promise<void[]> {
        const promises = this._nodeAddressList.map(addr => {
            const client = this._establishConnection(addr);
            client.notify(eventType, params);
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

    public kill(): void {
        console.error(chalk.red(`Killing node on ${this.address}`));
        this.rpcServer.close();
    }

    /**
     * GETTERS
     */

    public getledger(): Promise<Message[]> {
        return this._ledger.findMany({});
    }
    public get address(): string {
        return this._address;
    }
    public get addresses(): string[] {
        return this._nodeAddressList;
    }
}