import { randomUUID } from "node:crypto";
import { IEvent } from "./event-store";

export class MessageEvent implements IEvent {

    private readonly _id: string;

    public constructor(private readonly _message: string) {
        this._id = randomUUID();
    }

    public get id() {
        return this._id;
    }

    public get message() {
        return this._message;
    }
}