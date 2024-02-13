import { EventStore } from "./lib/event-store";
import { MessageEvent } from "./lib/message-event";

const database = new EventStore<MessageEvent>();