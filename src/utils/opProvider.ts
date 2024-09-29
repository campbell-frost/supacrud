import { Config } from './configManager.js';
import { createOps, readOps, updateOps, deleteOps, allOps, listOps } from './crudWrites.js';

export interface CrudOperation {
  execute(): Promise<void>;
}

export const getOperation = (
  operation: string,
  table: string,
  config: Config,
): CrudOperation => {
  switch (operation) {
    case 'all':
      return { execute: async () => await allOps(table, config) };
    case 'create':
      return { execute: async () => await createOps(table, config) };
    case 'read':
      return { execute: async () => await readOps(table, config) };
    case 'update':
      return { execute: async () => await updateOps(table, config) };
    case 'delete':
      return { execute: async () => await deleteOps(table, config) };
    case 'list':
      return { execute: async () => await listOps(table, config) };
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};