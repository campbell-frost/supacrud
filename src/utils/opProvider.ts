import { createOps, readOps, updateOps, deleteOps, allOps } from './crudWrites.js';

interface CrudOperation {
  execute(): Promise<void>;
}

class AllOperation implements CrudOperation {
  constructor(private table: string) { }
  async execute() {
    await allOps(this.table);
  }
}

class CreateOperation implements CrudOperation {
  constructor(private table: string) { }
  async execute() {
    await createOps(this.table);
  }
}

class ReadOperation implements CrudOperation {
  constructor(private table: string) { }
  async execute() {
    await readOps(this.table);
  }
}

class UpdateOperation implements CrudOperation {
  constructor(private table: string) { }
  async execute() {
    await updateOps(this.table);
  }
}

class DeleteOperation implements CrudOperation {
  constructor(private table: string) { }
  async execute() {
    await deleteOps(this.table);
  }
}

export class OpProvider {
  static getOperation(operation: string, table: string): CrudOperation {
    switch (operation) {
      case 'all':
        return new AllOperation(table)
      case 'create':
        return new CreateOperation(table);
      case 'read':
        return new ReadOperation(table)
      case 'update':
        return new UpdateOperation(table);
      case 'delete':
        return new DeleteOperation(table)
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
}