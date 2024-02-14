import { Node } from "./lib/node";
import { Message } from "./lib/message-event";
import chalk from "chalk";
import { deepEquals } from "bun";

const genesisNode = new Node(3000);
const node2 = genesisNode.addNode(3001);
const node3 = node2.addNode(3002);

setTimeout(() => {
    runSimulation();  
}, 1000);

async function runSimulation() {
    level1();
    // await level2();
    // await level3();
    // await level4();
    // await level5();
    // await level6();
}

function level1() {
    console.log(chalk.bold("\nTesting Level 1 ------------------->"));
    genesisNode.addEvent(Message.new("From genesisNode"));
    setTimeout(() => {
        console.log("Genesis Node", genesisNode.ledger);
        console.log("Node2", node2.ledger);
        console.log("Node3", node3.ledger);
    }, 1000);
}
async function level2() {
    console.log(chalk.bold("\nTesting Level 2 ------------------->"));
    node2.addEvent(Message.new("From node2"));
    const result = await compareLedgers();
    console.log(result);

}
async function level3() {
    console.log(chalk.bold("\nTesting Level 3 ------------------->"));
    /** Simulate failure */
    node3.kill();
    node2.addEvent(Message.new("From node2"));
    const result = await compareLedgers();
    console.log(result);
    
}
async function level4() {
    console.log(chalk.bold("\nTesting Level 4 ------------------->"));
    /** Check if node3 is updated with correct order */
    node3.addNode(3002);
    genesisNode.addEvent(Message.new("From genesisNode"));
    const result = await compareLedgers();
    console.log(result);
    
}
async function level5() {
    console.log(chalk.bold("\nTesting Level 5 ------------------->"));
    node2.addEvent(Message.new("From node2"));
    const result = await compareLedgers();
    console.log(result);

}
async function level6() {
    console.log(chalk.bold("\nTesting Level 6 ------------------->"));
    node3.addEvent(Message.new("From node3"));
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