import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import getTableSchema from './getTableSchema.js';
import { SupabaseClient } from '@supabase/supabase-js';

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const createFileName = async (tableName: string, opName: string): Promise<string> => {
  const currentPath = process.cwd();
  const destinationDir = path.join(currentPath, 'data', tableName);
  const destinationPath = path.join(destinationDir, `${opName}.ts`);
  try {
    await fs.promises.mkdir(destinationDir, { recursive: true });
    return destinationPath;
  }
  catch (error) {
    if (error instanceof Error) {
      console.log(`An error occurred creating the path for ${tableName}: ${error.message}`);
      throw error;
    } else {
      console.log(`An error occurred creating the path for ${tableName}: ${error}`);
      throw error;
    }
  }
}

export const createOps = async (tableName: string): Promise<void> => {  try {
    const schema = await getTableSchema(tableName);
    if (!schema) {
      throw new Error(`Schema for table '${tableName}' not found.`);
    }

    const properties = Object.entries(schema.Row)
      .map(([key, type]) => `  ${key}: ${type};`)
      .join('\n');

    const data = Object.entries(schema.Row)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `    ${key}: formData.${key},`)
      .join('\n');

    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'create');
    const content = `
import { createClient } from '@/utils/supabase/server';

interface create${formattedTableName}Props {
${properties}
}

export async function create${formattedTableName}(formData: create${formattedTableName}Props) {
  const supabase = await createClient();
  
  const data = {
${data}
  }

  const { error } = await supabase
  .from('${tableName}')
  .insert(data);

  if (error) {
    throw new Error(\`Error adding data: \${error.message}\`);
  }

  return { success: true };
}
`.trim();

    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Create operation file created successfully at ${filePath}`));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error creating create operation file: ${error.message}`));
    }
  }
}

export const readOps = async (tableName: string): Promise<void> => {  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'read');
    const content = `
import { createClient } from '@/utils/supabase/server';

export async function read${formattedTableName}() {
  const supabase = await createClient();

  const { data, error } = await supabase
  .from('${tableName}')
  .select('*');

  if(error){
    throw new Error(\`Error reading data: \${error.message}\`);
  }
  
  return data;
}
`.trim();
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Read operation file created successfully at ${filePath}`));
  } catch (error) {
    if (error instanceof Error) {

      console.error(chalk.red(`Error creating read operation file: ${error.message}`));
    }
  }
}

export const updateOps = async (tableName: string): Promise<void> => {  try {

    const schema = await getTableSchema(tableName);
    if (!schema) {
      throw new Error(`Schema for table '${tableName}' not found.`);
    }

    const properties = Object.entries(schema.Row)
      .map(([key, type]) => `  ${key}: ${type};`)
      .join('\n');

    const data = Object.entries(schema.Row)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `    ${key}: formData.${key},`)
      .join('\n');

    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'update');
    const content = `
import { createClient } from '@/utils/supabase/server';

interface update${formattedTableName}Props {
${properties}
}

export async function update${formattedTableName}(formData: update${formattedTableName}Props) {
  const { data: result, error } = await supabase
    .from('${tableName}')
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return result;
}
`.trim();
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Update operation file created successfully at ${filePath}`));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error creating update operation file: ${error.message}`));
    }
  }
}

export const deleteOps = async (tableName: string): Promise<void> => {  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'delete');
    const content = `
import { createClient } from '@/utils/supabase/server';
// This is the default location for your SupaBase config in Nextjs projects.  You might have to edit this if you are using a different framework.

interface delete${formattedTableName}Props {
  id: string;
}

export async function delete${formattedTableName}(id: delete${tableName}Props) {
  const supabase = await createClient();

  const { error } = await supabase.from('${tableName}').delete().eq('id', id);
  if (error) {
    throw new Error(\`Error deleting data: \${error.message}\`);
  }

  return { success: true };
}
`.trim();
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Delete operation file created successfully at ${filePath}`));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error creating delete operation file: ${error.message}`));
    }
  }
}

export const listOps = async (tableName: string): Promise<void> => {  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'list');
    const content =
      `
import { createClient } from "@/utils/supabase/server";

export default async function get${formattedTableName}(){
    const supabase = await createClient();
    const { data: ${tableName}, error } = await supabase
    .from('${tableName}')
    .select('*')
    .order('date', { ascending: true });
    
    if (error) {
        throw new Error(\`An error occured retreiving data \${error.message}\`)
    }
    return ${tableName};
}
`.trim();

    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`List operation file created successfully at ${filePath}`));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error creating list operation file: ${error.message}`));
    }
  }
}


export const allOps = async (tableName: string): Promise<void> => {
  await createOps(tableName);
  await readOps(tableName);
  await updateOps(tableName);
  await deleteOps(tableName);
  await listOps(tableName);
  console.log(chalk.green(`All CRUD operation files generated for table: ${tableName}`));
}