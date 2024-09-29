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

function findTypesFile(currentDir: string): string | null {
  const typesPaths = [
    path.join(currentDir, 'types', 'supabase.ts'),
    path.join(currentDir, 'database.types.ts')
  ];

  for (const typesPath of typesPaths) {
    if (fs.existsSync(typesPath)) {
      return typesPath;
    }
  }

  return null;
}

function parseTypesFile(filePath: string): ts.SourceFile {
  const file = fs.readFileSync(filePath, 'utf-8');
  return ts.createSourceFile(
    path.basename(filePath),
    file,
    ts.ScriptTarget.Latest,
    true
  );
}

export function getAllTables(currentDir: string): string[] {
  const typesFile = findTypesFile(currentDir);
  if (!typesFile) {
    console.error(chalk.red(`No types files found. Have you run 'supabase gen types'?`));
    console.error(chalk.yellow(`You can get started here: https://supabase.com/docs/guides/api/rest/generating-types`));
    return [];
  }

  const sourceFile = parseTypesFile(typesFile);
  const tables: string[] = [];

  function findTablesInterface(node: ts.Node): void {
    if (
      ts.isPropertySignature(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'Tables' &&
      node.type &&
      ts.isTypeLiteralNode(node.type)
    ) {
      node.type.members.forEach(member => {
        if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
          tables.push(member.name.text);
        }
      });
    }
    ts.forEachChild(node, findTablesInterface);
  }

  findTablesInterface(sourceFile);
  return tables;
}

export async function getTableSchema<T extends keyof DatabaseSchema>(
  tableName: T,
): Promise<DatabaseSchema[T] | null> {
  const typesFile = findTypesFile(process.cwd());
  if (!typesFile) {
    console.error(chalk.red(`No types files found. Have you run 'supabase gen types'?`));
    console.error(chalk.yellow(`You can get started here: https://supabase.com/docs/guides/api/rest/generating-types`));
    return null;
  }

  try {
    const sourceFile = parseTypesFile(typesFile);

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
      const schema: DatabaseSchema[T] = {
        Row: {},
        Insert: {},
        Update: {},
      };

      tableNode.type.members.forEach(member => {
        if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
          const propertyName = member.name.text;
          if (['Row', 'Insert', 'Update'].includes(propertyName) && member.type && ts.isTypeLiteralNode(member.type)) {
            const obj: Record<string, string | undefined> = {};
            member.type.members.forEach(subMember => {
              if (ts.isPropertySignature(subMember) && ts.isIdentifier(subMember.name)) {
                const subPropertyName = subMember.name.text;
                const subPropertyType = subMember.type ? subMember.type.getText(sourceFile) : 'any';
                obj[subPropertyName] = subPropertyType;
              }
            });
            schema[propertyName as keyof TableSchema] = obj;
          }
        }
      });

      return schema;
    }
  } catch (error) {
    console.error(chalk.yellow(`Error parsing file ${typesFile}:`, error));
  }

  console.error(chalk.red(`Table '${tableName}' not found in the types file.`));
  return null;
}