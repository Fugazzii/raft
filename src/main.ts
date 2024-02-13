import { Node } from "./lib/node";
import { MessageEvent } from "./lib/message-event";
import chalk from "chalk";

const genesisNode = new Node(3000);
const node2 = genesisNode.join(3001);
const node3 = node2.join(3002);

setTimeout(() => {
    runSimulation();  
}, 1000);

async function runSimulation() {
    await level1();
    // await level2();
    // await level3();
    // await level4();
    // await level5();
    // await level6();
}

async function level1() {
    console.log(chalk.bold("\nTesting Level 1 ------------------->"));
    await genesisNode.publish(MessageEvent.new("From genesisNode"));
    await displayAll();
}
async function level2() {
    console.log(chalk.bold("\nTesting Level 2 ------------------->"));
    await node2.publish(MessageEvent.new("From node2"));
    await displayAll();
}
async function level3() {
    console.log(chalk.bold("\nTesting Level 3 ------------------->"));
    /** Simulate failure */
    node3.kill();
    await node2.publish(MessageEvent.new("From node2"));
    await displayAll();    
}
async function level4() {
    console.log(chalk.bold("\nTesting Level 4 ------------------->"));
    /** Check if node3 is updated with correct order */
    node3.join(3002);
    await genesisNode.publish(MessageEvent.new("From genesisNode"));
    await displayAll();    
}
async function level5() {
    console.log(chalk.bold("\nTesting Level 5 ------------------->"));
    await node2.publish(MessageEvent.new("From node2"));
    await displayAll();
}
async function level6() {
    console.log(chalk.bold("\nTesting Level 6 ------------------->"));
    await node3.publish(MessageEvent.new("From node3"));
    await displayAll();
}

async function displayAll() {
    return new Promise((resolve) => {
        setTimeout(() => {
            genesisNode.displayLedger("Node 1 Ledger");
            node2.displayLedger("Node 2 Ledger");
            node3.displayLedger("Node 3 Ledger");    
            resolve(null);    
        }, 1000);
    })
}