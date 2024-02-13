import { Node } from "./lib/node";
import { MessageEvent } from "./lib/message-event";

const node1 = new Node();
const node2 = new Node();
const node3 = new Node();

node1.start(3000);
node2.start(3001);
node3.start(3002);

setTimeout(() => {
    runSimulation();  
}, 1000);

function runSimulation() {
    node1.publish(MessageEvent.new("Hello 1"));
    displayAll();

    node2.publish(MessageEvent.new("Hello 2"));
    displayAll();

    /** Simulate failure */
    node3.kill();
    node2.publish(MessageEvent.new("Hello 3"));
    displayAll();

    /** Check if node3 is updated with correct order */
    node3.start(3002);
    node1.publish(MessageEvent.new("Hello 4"));
    displayAll();

    node2.publish(MessageEvent.new("Hello 5"));

    function displayAll() {
        node1.displayLedger("Node 1 Ledger");
        node2.displayLedger("Node 2 Ledger");
        node3.displayLedger("Node 3 Ledger");    
    }
}