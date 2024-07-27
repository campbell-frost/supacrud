import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import * as ts from "typescript";

export default async function getTableSchema(tableName: string) {
  const currentDir = process.cwd();
  const typesDir = path.join(currentDir, 'types', 'supabase.ts');
  
  try {
    const file = fs.readFileSync(typesDir, 'utf-8');
    
    const sourceFile = ts.createSourceFile(
      'supabase.ts',
      file,
      ts.ScriptTarget.Latest,
      true
    );

    function findTableInterface(node: ts.Node): ts.Node | undefined {
      if (
        ts.isPropertySignature(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === tableName &&
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
        const rowInterface = rowProperty.type.members
          .map(member => sourceFile.text.slice(member.pos, member.end))
          .join('\n');

        return rowInterface;
      }
    }

    console.error(chalk.red(`Table '${tableName}' or its Row interface not found in the types file.`));
    return null;
  } catch (error) {
    console.error(chalk.red(`Error retrieving Types file. Have you run supabase gen types?: ${error.message}`));
    return null;
  }
}