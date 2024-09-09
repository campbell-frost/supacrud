import { createOps, readOps, updateOps, deleteOps, allOps, listOps } from './crudWrites.js';
class AllOperation {
    table;
    constructor(table) {
        this.table = table;
    }
    async execute() {
        await allOps(this.table);
    }
}
class CreateOperation {
    table;
    constructor(table) {
        this.table = table;
    }
    async execute() {
        await createOps(this.table);
    }
}
class ReadOperation {
    table;
    constructor(table) {
        this.table = table;
    }
    async execute() {
        await readOps(this.table);
    }
}
class UpdateOperation {
    table;
    constructor(table) {
        this.table = table;
    }
    async execute() {
        await updateOps(this.table);
    }
}
class DeleteOperation {
    table;
    constructor(table) {
        this.table = table;
    }
    async execute() {
        await deleteOps(this.table);
    }
}
class ListOperation {
    table;
    constructor(table) {
        this.table = table;
    }
    async execute() {
        await listOps(this.table);
    }
}
export class OpProvider {
    static getOperation(operation, table) {
        switch (operation) {
            case 'all':
                return new AllOperation(table);
            case 'create':
                return new CreateOperation(table);
            case 'read':
                return new ReadOperation(table);
            case 'update':
                return new UpdateOperation(table);
            case 'delete':
                return new DeleteOperation(table);
            case 'list':
                return new ListOperation(table);
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    }
}
