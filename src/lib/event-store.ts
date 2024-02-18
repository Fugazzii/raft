import { BunFile, FileSink } from "bun";
import { Message } from "./message-event";

type FindManyOptions = {
    limit?: number;
    offset?: number;
};

export class EventStore {
    private readonly _fs: BunFile;
    private readonly _writer: FileSink;
    private _filename: string;
    private _lastHash: string | null;
    private _eventsCache: Array<Message>;

    public constructor(_address: string) {
        this._filename = `logs/${_address}.csv`;
        this._fs = Bun.file(this._filename);
        this._writer = this._fs.writer();
        this._eventsCache = [];
        this._lastHash = null;
    }

    public add(event: Message): Promise<number> {
        this._eventsCache = [];
        this._lastHash = event.id;
        const buf = this._serialize(event);
        return this._appendAndFlush(buf);
    }

    public async insertMany(events: Message[]) {
        this._eventsCache = [];
        this._lastHash = events.at(-1)?.id as string;
        const buf = events.map(this._serialize).join();
        return this._appendAndFlush(buf);
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

    public async findMany(findManyOptions: FindManyOptions): Promise<Message[]> {
        const h = await this.ledgerHeight();
        
        if(this._eventsCache.length !== h) {
            const txt = await this._fs.text();
            const nonParsed = txt.split("\n").filter(obj => !!obj);
            this._eventsCache = nonParsed.map(this._deserialize);
        }
        
        const { offset = 0, limit = h } = findManyOptions;

        const startIndex = h - offset;
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

    private _appendAndFlush(buf: string): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                this._writer.write(buf);
                resolve(this._writer.flush());
            } catch (error) {
                console.error("Failed to write and flush to disk");
                reject(error);
            }
        });
    }

    private _serialize(event: Message): string {
        try {
            return JSON.stringify(event) + "\n";
        } catch (error) {
            console.error("Failed to serialize");
            throw error;
        }
    }

    private _deserialize(str: string): Message {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.error("Failed to deserialize");
            throw error;
        }
    }

    public async ledgerHeight() {
        const content = await this._fs.text();
        const lines = content.split(/\r?\n/);
        return lines.length;
    }
}
