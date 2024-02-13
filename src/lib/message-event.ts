import { randomUUID } from "node:crypto";
import { IEvent } from "./event-store";

export class MessageEvent implements IEvent {

    private readonly _id: string;
    private readonly _timestamp: number;
    
    private constructor(private readonly _message: string) {
        this._id = randomUUID();
        this._timestamp = Date.now();
    }

    public get id() {
        return this._id;
    }

    public get timestamp() {
        return this._timestamp;
    }

    public get message() {
        return this._message;
    }

    public static new(_message: string) {
        return new MessageEvent(_message);
    }
}