export interface IEvent {
    get id(): string | number | symbol;
}

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
}
