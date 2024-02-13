import { Node } from "./lib/node";
import { MessageEvent } from "./lib/message-event";
import chalk from "chalk";
import { deepEquals } from "bun";

const genesisNode = new Node(3000);
const node2 = genesisNode.join(3001);
const node3 = node2.join(3002);

setTimeout(() => {
    runSimulation();  
}, 1000);

async function runSimulation() {
    // await level1();
    // await level2();
    // await level3();
    // await level4();
    // await level5();
    // await level6();
}

async function level1() {
    console.log(chalk.bold("\nTesting Level 1 ------------------->"));
    await genesisNode.publish(MessageEvent.new("From genesisNode"));
    setTimeout(() => {
        console.log("Genesis Node", genesisNode.ledger);
        console.log("Node2", node2.ledger);
        console.log("Node3", node3.ledger);
    }, 1000);
}
async function level2() {
    console.log(chalk.bold("\nTesting Level 2 ------------------->"));
    await node2.publish(MessageEvent.new("From node2"));
    const result = await compareLedgers();
    console.log(result);

}
async function level3() {
    console.log(chalk.bold("\nTesting Level 3 ------------------->"));
    /** Simulate failure */
    node3.kill();
    await node2.publish(MessageEvent.new("From node2"));
    const result = await compareLedgers();
    console.log(result);
    
}
async function level4() {
    console.log(chalk.bold("\nTesting Level 4 ------------------->"));
    /** Check if node3 is updated with correct order */
    node3.join(3002);
    await genesisNode.publish(MessageEvent.new("From genesisNode"));
    const result = await compareLedgers();
    console.log(result);
    
}
async function level5() {
    console.log(chalk.bold("\nTesting Level 5 ------------------->"));
    await node2.publish(MessageEvent.new("From node2"));
    const result = await compareLedgers();
    console.log(result);

}
async function level6() {
    console.log(chalk.bold("\nTesting Level 6 ------------------->"));
    await node3.publish(MessageEvent.new("From node3"));
    const result = await compareLedgers();
    console.log(result);
}

async function compareLedgers() {
    return new Promise((resolve, reject) => {
        setTimeout(() => { 
            const test1 = deepEquals(
                genesisNode.ledger,
                node2.ledger
            );
            const test2 = deepEquals(
                genesisNode.ledger,
                node3.ledger
            );
            if(test1 && test2) {
                resolve(true);
            } else {
                reject(false);
            }
        }, 1000);
    })
}