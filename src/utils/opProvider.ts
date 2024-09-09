import { createOps, readOps, updateOps, deleteOps, allOps, listOps } from './crudWrites.js';

export interface CrudOperation {
  execute(): Promise<void>;
}

export const getOperation = (
  operation: string,
  table: string,
): CrudOperation => {
  switch (operation) {
    case 'all':
      return { execute: async () => await allOps(table) };
    case 'create':
      return { execute: async () => await createOps(table) };
    case 'read':
      return { execute: async () => await readOps(table) };
    case 'update':
      return { execute: async () => await updateOps(table) };
    case 'delete':
      return { execute: async () => await deleteOps(table) };
    case 'list':
      return { execute: async () => await listOps(table) };
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};