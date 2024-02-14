import { randomUUID } from "node:crypto";

export class Message {

    private readonly _id: string;
    private readonly _timestamp: number;

    private constructor(
        private readonly _message: string,
        private readonly _author: string
    ) {
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

    public get author() {
        return this._author;
    }

    public static new(_message: string, _author: string) {
        return new Message(_message, _author);
    }
}