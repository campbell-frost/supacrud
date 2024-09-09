import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ts from 'typescript';
export default async function getTableSchema(tableName) {
    const currentDir = process.cwd();
    const typesDir = path.join(currentDir, 'types', 'supabase.ts');
    try {
        const file = fs.readFileSync(typesDir, 'utf-8');
        const sourceFile = ts.createSourceFile('supabase.ts', file, ts.ScriptTarget.Latest, true);
        function findTableInterface(node) {
            if (ts.isPropertySignature(node) &&
                ts.isIdentifier(node.name) &&
                node.name.text === tableName &&
                node.parent &&
                ts.isTypeLiteralNode(node.parent) &&
                node.parent.parent &&
                ts.isPropertySignature(node.parent.parent) &&
                ts.isIdentifier(node.parent.parent.name) &&
                node.parent.parent.name.text === 'Tables') {
                return node;
            }
            return ts.forEachChild(node, findTableInterface);
        }
        const tableNode = findTableInterface(sourceFile);
        if (tableNode && ts.isPropertySignature(tableNode) && tableNode.type && ts.isTypeLiteralNode(tableNode.type)) {
            const rowProperty = tableNode.type.members.find(member => ts.isPropertySignature(member) &&
                ts.isIdentifier(member.name) &&
                member.name.text === 'Row');
            if (rowProperty && ts.isPropertySignature(rowProperty) && rowProperty.type && ts.isTypeLiteralNode(rowProperty.type)) {
                const rowObject = {};
                rowProperty.type.members.forEach(member => {
                    if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
                        const propertyName = member.name.text;
                        const propertyType = member.type ? member.type.getText(sourceFile) : 'any';
                        rowObject[propertyName] = propertyType;
                    }
                });
                const schema = {
                    Row: rowObject,
                    Insert: rowObject,
                    Update: rowObject,
                };
                return schema;
            }
        }
        console.error(chalk.red(`Table '${tableName}' or its Row interface not found in the types file.`));
        return null;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red(`Error retrieving Types file. Have you run supabase gen types?: ${error.message}`));
            return null;
        }
        else {
            console.error(chalk.red(`Error retrieving Types file. Have you run supabase gen types?: ${error}`));
            return null;
        }
    }
}
