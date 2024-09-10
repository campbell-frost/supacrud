import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import getTableSchema from './getTableSchema.js';

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

type Config = {
  projectUrl: string;
  apiKey: string;
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

export const createOps = async (tableName: string, config: Config): Promise<void> => {
  try {
    const schema = await getTableSchema(tableName);
    if (!schema) {
      throw new Error(`Schema for table '${tableName}' not found.`);
    }

    const createInterface = Object.entries(schema.Row)
      .map(([key, type]) => `  ${key}: ${type};`)
      .join('\n');

    const data = Object.entries(schema.Row)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `    ${key}: formData.${key},`)
      .join('\n');

    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'create');
    const content = `
import { createClient } from "@supabase/supabase-js";
interface create${formattedTableName}Props {
${createInterface}
}

export async function create${formattedTableName}(formData: create${formattedTableName}Props) {
  const supabase = createClient("${config.projectUrl}", "${config.apiKey}");
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

export const readOps = async (tableName: string, config: Config): Promise<void> => {
  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'read');
    const content = `
import { createClient } from "@supabase/supabase-js";

export async function read${formattedTableName}() {
  const supabase = createClient("${config.projectUrl}", "${config.apiKey}");

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

export const updateOps = async (tableName: string, config: Config): Promise<void> => {
  try {

    const schema = await getTableSchema(tableName);
    if (!schema) {
      throw new Error(`Schema for table '${tableName}' not found.`);
    }

    const updateInterface = Object.entries(schema.Row)
      .map(([key, type]) => `  ${key}: ${type};`)
      .join('\n');

    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'update');
    const content = `
import { createClient } from "@supabase/supabase-js";

interface update${formattedTableName}Props {
${updateInterface}
}

export async function update${formattedTableName}(formData: update${formattedTableName}Props) {
  const supabase = createClient("${config.projectUrl}", "${config.apiKey}");
  const { data: result, error } = await supabase
    .from('${tableName}')
    .update(formData)
    .eq('id', formData.id)
    .select();
  
  if (error){
      throw new Error(\`Error uploading data: \${error.message}\`);
  }
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

export const deleteOps = async (tableName: string, config: Config): Promise<void> => {
  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'delete');
    const content = `
import { createClient } from "@supabase/supabase-js";

interface delete${formattedTableName}Props {
  id: string;
}

export async function delete${formattedTableName}(id: delete${formattedTableName}Props) {
  const supabase = createClient("${config.projectUrl}", "${config.apiKey}");

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

export const listOps = async (tableName: string, config: Config): Promise<void> => {
  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'list');
    const content =
      `
import { createClient } from "@supabase/supabase-js";

export default async function get${formattedTableName}(){
  const supabase = createClient("${config.projectUrl}", "${config.apiKey}");
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


export const allOps = async (tableName: string, config: Config): Promise<void> => {
  await createOps(tableName, config);
  await readOps(tableName, config);
  await updateOps(tableName, config);
  await deleteOps(tableName, config);
  await listOps(tableName, config);
  console.log(chalk.green(`All CRUD operation files generated for table: ${tableName}`));
}