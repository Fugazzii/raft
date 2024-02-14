import { FileSink, deepEquals } from "bun";
import { Message } from "./message-event";

type FindManyOptions = {
    limit?: number;
    offset?: number;
};

export class EventStore {
    private readonly _writer!: FileSink;

    public constructor(
        private readonly _events: Array<Message> = []
    ) {
        // this._writer = Bun.file(`logs/${Date.now()}.json`).writer();
    }

    public copy() {
        const copiedMsgs = this._events.map(ev => {
            return Message.new(ev.message, ev.author);
        });
        return new EventStore(copiedMsgs);
    }

    public async add(event: Message): Promise<void> {
        try {
            // this._writer.write(JSON.stringify(event));
            // await this._writer.flush();   
            this._events.push(event);
        } catch (error) {
            throw error;            
        }
    }

    public find(event: Message): Message | null {
        const found = this._events.find(ev => ev.id === event.id);
        return found ? found : null;
    }

    public findMany(findManyOptions: FindManyOptions): Message[] {
        const { offset = 0, limit = this.eventsCount } = findManyOptions;
    
        const startIndex = this.eventsCount - offset;
        const endIndex = startIndex - limit;

        return this._events.slice(endIndex, startIndex);
    }

    public get eventsCount() {
        return this._events.length;
    }
}
