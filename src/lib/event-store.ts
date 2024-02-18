import { BunFile, FileSink } from "bun";
import { Message } from "./message-event";

type FindManyOptions = {
    limit?: number;
    offset?: number;
};

type BufferLike = string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer;

export class EventStore {
    private readonly _fs: BunFile;
    private _lastHash: string | null;
    private _eventsCache: Array<Message>;

    public constructor(_address: string) {
        this._fs = Bun.file(`logs/${_address}.csv`);
        this._eventsCache = [];
        this._lastHash = null;
    }

    public add(event: Message): Promise<number> {
        this._eventsCache = [];
        this._lastHash = event.id;
        const buf = this._serialize(event);
        return this._writeAndFlush(buf);
    }

    public async insertMany(events: Message[]) {
        this._eventsCache = [];
        this._lastHash = events.at(-1)?.id as string;
        const buf = events.map(this._serialize).join();
        return this._writeAndFlush(buf);
    }

    public async find(event: Message): Promise<Message | null> {
        const found = this._eventsCache.find(ev => ev.id === event.id);

        if(found) {
            return found;
        }

        const text = await this._fs.text();
        const lines = text.split("\n");
        
        const handleLine = (line: string) => {
            try {
                const parsed: Message = JSON.parse(line);
                return parsed.id === event.id ? parsed : null;
            } catch (error) {
                throw error;
            }
        }

        const parsedLines: Array<Message | null> = lines.map(handleLine);
        let result: Message | null = null;

        parsedLines.forEach((msg: Message | null) => {
            if(msg !== null) {
                result = msg;
            }
        });

        return result;
    }

    public findMany(findManyOptions: FindManyOptions): Message[] {
        const { offset = 0, limit = this.ledgerHeight } = findManyOptions;
    
        const startIndex = this.ledgerHeight - offset;
        const endIndex = startIndex - limit;

        return this._eventsCache.slice(endIndex, startIndex);
    }

    public update(newLedger: Message[]) {
        if(!this._lastHash) {
            this._eventsCache = newLedger;

        }
        let lastHashIndex = -1;
        for (let i = 0; i < newLedger.length; i++) {
            if(newLedger[i].id === this._lastHash) {
                lastHashIndex = i;
                break;
            }
        }

        newLedger.splice(lastHashIndex);
        this.insertMany(newLedger);
    }

    private _writeAndFlush(buf: BufferLike): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                const writer: FileSink = this._fs.writer();
                writer.write(buf);
                resolve(writer.flush());                        
            } catch (error) {
                console.error("Failed to write and flush to disk");
                reject(error);
            }
        });
    }

    private _serialize(event: Message): Buffer {
        try {
            return Buffer.from(JSON.stringify(event) + "\n");
        } catch (error) {
            console.error("Failed to serialize");
            throw error;
        }
    }

    public get ledgerHeight() {
        return this._eventsCache.length;
    }
}
