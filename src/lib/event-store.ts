export interface IEvent {
    get id(): string | number | symbol;
}

type FindManyOptions = {
    limit?: number;
    offset?: number;
};

export class EventStore<Event extends IEvent> {
    private readonly _events: Array<Event>;

    public constructor() {
        this._events = [];
    }

    public add(event: Event): void {
        this._events.push(event);
    }

    public find(event: IEvent): Event | null {
        const found = this._events.find(ev => ev.id === event.id);
        return found ? found : null;
    }

    public findMany(findManyOptions: FindManyOptions): Event[] {
        const { offset = 0, limit = this.eventsCount } = findManyOptions;
    
        const startIndex = this.eventsCount - offset;
        const endIndex = startIndex - limit;
    
        return this._events.slice(endIndex, startIndex);
    }

    public get eventsCount() {
        return this._events.length;
    }
}
