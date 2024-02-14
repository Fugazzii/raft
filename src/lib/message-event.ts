import { randomUUID } from "node:crypto";

export class Message {

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
        return new Message(_message);
    }
}