<!-- # RAFT

## Network

#### Node 1
    HTTP Server: 8000
    RPC Server: 3000
    RPC Clients: [3001, 3002]
#### Node 2
    HTTP Server: 8001
    RPC Server: 3001
    RPC Clients: [3000, 3002]
#### Node 3
    HTTP Server: 8002
    RPC Server: 3002
    RPC Clients: [3000, 3001]
     -->

## RPC

### Commands
- **add_node** - Add new Node in network
    - Check if node already exists
    - Broadcast new node address to network
- **add_event** - Publish event

### Queries
- **get_ledger** - Get events
- **get_nodes** - Get all node addresses
- **request_data** - Downloads data from network