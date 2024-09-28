import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ts from 'typescript';

interface TableSchema {
  Row: Record<string, string | undefined>;
  Insert: Partial<Record<string, string | undefined>>;
  Update: Partial<Record<string, string | undefined>>;
}

interface DatabaseSchema {
  [tableName: string]: TableSchema;
}

export default async function getTableSchema<T extends keyof DatabaseSchema>(tableName: T): Promise<DatabaseSchema[T] | null> {
  const currentDir = process.cwd();
  const typesPaths = [
    path.join(currentDir, 'types', 'supabase.ts'),
    path.join(currentDir, 'database.types.ts')
  ];

  for (const typesPath of typesPaths) {
    try {
      const file = fs.readFileSync(typesPath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        path.basename(typesPath),
        file,
        ts.ScriptTarget.Latest,
        true
      );

      function findTableInterface(node: ts.Node): ts.Node | undefined {
        if (
          ts.isPropertySignature(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text.toLowerCase() === tableName.toString().toLowerCase() &&
          node.parent &&
          ts.isTypeLiteralNode(node.parent) &&
          node.parent.parent &&
          ts.isPropertySignature(node.parent.parent) &&
          ts.isIdentifier(node.parent.parent.name) &&
          node.parent.parent.name.text === 'Tables'
        ) {
          return node;
        }
        return ts.forEachChild(node, findTableInterface);
      }

      const tableNode = findTableInterface(sourceFile);
      if (tableNode && ts.isPropertySignature(tableNode) && tableNode.type && ts.isTypeLiteralNode(tableNode.type)) {
        const rowProperty = tableNode.type.members.find(member =>
          ts.isPropertySignature(member) &&
          ts.isIdentifier(member.name) &&
          member.name.text === 'Row'
        );
        if (rowProperty && ts.isPropertySignature(rowProperty) && rowProperty.type && ts.isTypeLiteralNode(rowProperty.type)) {
          const rowObject: Record<string, string | undefined> = {};
          rowProperty.type.members.forEach(member => {
            if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
              const propertyName = member.name.text;
              const propertyType = member.type ? member.type.getText(sourceFile) : 'any';
              rowObject[propertyName] = propertyType;
            }
          });
          const schema: DatabaseSchema[T] = {
            Row: rowObject,
            Insert: rowObject,
            Update: rowObject,
          };
          return schema;
        }
      }
    } catch (error) {
      // If the file doesn't exist or there's an error reading it, we'll try the next path
      continue;
    }
  }
  console.error(chalk.red(`Error retrieving Types file. Have you run supabase gen types?`));
  return null;
}