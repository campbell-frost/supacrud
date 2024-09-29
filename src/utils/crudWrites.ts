import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import getTableSchema from './getTableSchema.js';
import { Config } from './configManager.js';

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const singularize = (noun: string): string => {
  if (noun.endsWith('s')) {
    if (noun.endsWith('ies')) {
      return noun.slice(0, -3) + 'y';
    }
    return noun.slice(0, -1);
  }
  return noun;
}

const generateSupabaseClientCode = (config: Config): string => {
  if (config.env && config.prefix) {
    return `const supabaseUrl = process.env.${config.prefix.projectUrl};
  const supabaseKey = process.env.${config.prefix.apiKey};\n
  const supabase = createClient(supabaseUrl!, supabaseKey!);`;
  } else {
    return `const supabase = createClient("${config.suffix.projectUrl}", "${config.suffix.apiKey}");`;
  }
};

export const createFileName = async (tableName: string, opName: string): Promise<string> => {
  const currentPath = process.cwd();
  const destinationDir = path.join(currentPath, 'data', tableName.toLowerCase());
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

    const singularTableName = singularize(tableName);
    const formattedTableName = capitalizeFirstLetter(singularize(tableName));
    const createInterface = Object.entries(schema.Row)
      .filter(([key]) => key !== 'created_at')
      .map(([key, type]) => `  ${key}: ${type};`)
      .join('\n');

    const data = Object.entries(schema.Row)
      .filter(([key]) => key !== 'created_at')
      .map(([key]) => `    ${key}: ${singularTableName}.${key},`)
      .join('\n');

    const filePath = await createFileName(tableName, 'create');
    const supabaseClientCode = generateSupabaseClientCode(config);
    const content = `
import { createClient } from "@supabase/supabase-js";

interface Create${formattedTableName}Request {
${createInterface}
}

export const create${formattedTableName} = async (${singularTableName}: Create${formattedTableName}Request) => {
  ${supabaseClientCode}

  const data = {
${data}
  };

  const { error } = await supabase
    .from("${tableName}")
    .insert(data)
    .single();
  
  if (error instanceof Error) {
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
};

export const readOps = async (tableName: string, config: Config): Promise<void> => {
  try {
    const formattedTableName = capitalizeFirstLetter(tableName);
    const filePath = await createFileName(tableName, 'read');
    const supabaseClientCode = generateSupabaseClientCode(config);

    const content = `
import { createClient } from "@supabase/supabase-js";

export const read${formattedTableName} = async () => {
  ${supabaseClientCode}

  const { data, error } = await supabase
    .from('${tableName}')
    .select('*');

  if (error instanceof Error) {
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
};

export const updateOps = async (tableName: string, config: Config): Promise<void> => {
  try {

    const singularTableName = singularize(tableName);
    const formattedTableName = capitalizeFirstLetter(singularize(tableName));

    const schema = await getTableSchema(tableName);
    if (!schema) {
      throw new Error(`Schema for table '${tableName}' not found.`);
    }

    const updateInterface = Object.entries(schema.Row)
      .filter(([key]) => key !== 'created_at')
      .map(([key, type]) => `  ${key}: ${type};`)
      .join('\n');

    const filePath = await createFileName(tableName, 'update');
    const supabaseClientCode = generateSupabaseClientCode(config);

    const content = `
import { createClient } from "@supabase/supabase-js";

interface Update${formattedTableName}Request {
${updateInterface}
}

export const update${formattedTableName} = async (${singularTableName}: Update${formattedTableName}Request) => {
  ${supabaseClientCode}

  const { data: result, error } = await supabase
    .from('${tableName}')
    .update(${singularTableName})
    .eq('id', ${singularTableName}.id)
    .select();
  
  if (error instanceof Error) {
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
    const singularTableName = singularize(tableName);
    const formattedTableName = capitalizeFirstLetter(singularize(tableName));

    const filePath = await createFileName(tableName, 'delete');
    const supabaseClientCode = generateSupabaseClientCode(config);

    const content = `
import { createClient } from "@supabase/supabase-js";

interface Delete${formattedTableName}Request {
  id: string;
}

export const delete${formattedTableName} = async (${singularTableName}: Delete${formattedTableName}Request) => {
  ${supabaseClientCode}

  const { error } = await supabase
    .from('${tableName}')
    .delete()
    .eq('id', ${singularTableName}.id);

  if (error instanceof Error) {
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
    const supabaseClientCode = generateSupabaseClientCode(config);

    const content =
      `
import { createClient } from "@supabase/supabase-js";

export const get${formattedTableName} = async () => {
  ${supabaseClientCode}

  const { data: ${tableName}, error } = await supabase
    .from('${tableName}')
    .select('*')
    .order('date', { ascending: true });
  
  if (error instanceof Error) {
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