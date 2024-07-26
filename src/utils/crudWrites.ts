import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export async function createFileName(tableName: string, opName: string): Promise<string> {
  const currentPath = process.cwd();
  const destinationDir = path.join(currentPath, 'data', tableName);
  const destinationPath = path.join(destinationDir, `${opName}.ts`);
  try {
    await fs.promises.mkdir(destinationDir, { recursive: true });
    return destinationPath;
  }
  catch (error) {
    console.log(`An error occurred creating the path for ${tableName}: ${error.message}`);
    throw error;
  }
}

export async function createOps(tableName: string): Promise<void> {
  try {
    const filePath = await createFileName(tableName, 'create');
    const content = `
    import { supabase } from '@/utils/supabase/server';
    // This is the default location for your SupaBase config in Nextjs projects.  you might have to edit this if you are using a different framework.

    export async function create${tableName}(data: any) {
      const { data: result, error } = await supabase
        .from('${tableName}')
        .insert(data)
        .select();
      
      if (error) throw error;
      return result;
    }
`;
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Create operation file created successfully at ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error creating create operation file: ${error.message}`));
  }
}

export async function readOps(tableName: string): Promise<void> {
  try {
    const filePath = await createFileName(tableName, 'read');
    const content = `
      import { supabase } from '@/utils/supabase/server';
      // This is the default location for your SupaBase config in Nextjs projects.  you might have to edit this if you are using a different framework.

      export async function read${tableName}(id?: string) {
        let query = supabase.from('${tableName}').select('*');
        
        if (id) {
          query = query.eq('id', id);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return data;
      }
      `;
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Read operation file created successfully at ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error creating read operation file: ${error.message}`));
  }
}

export async function updateOps(tableName: string): Promise<void> {
  try {
    const filePath = await createFileName(tableName, 'update');
    const content = `
    import { supabase } from '@/utils/supabase/server';
    // This is the default location for your SupaBase config in Nextjs projects.  you might have to edit this if you are using a different framework.

    export async function update${tableName}(id: string, data: any) {
      const { data: result, error } = await supabase
        .from('${tableName}')
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return result;
    }
    `;
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Update operation file created successfully at ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error creating update operation file: ${error.message}`));
  }
}

export async function deleteOps(tableName: string): Promise<void> {
  try {
    const filePath = await createFileName(tableName, 'delete');
    const content = `
      import { createClient } from '@/utils/supabase/server';

      interface delete${tableName}Props {
        id: string;
      }

      export async function delete${tableName}(id: delete${tableName}Props) {
        const supabase = await createClient();

        const { error } = await supabase.from('${tableName}').delete().eq('id', id);
        if (error) {
          throw new Error(\`Error deleting data: \${error.message}\`);
        }

        return { success: true };
      }
`;
    await fs.promises.writeFile(filePath, content);
    console.log(chalk.green(`Delete operation file created successfully at ${filePath}`));
  } catch (error) {
    console.error(chalk.red(`Error creating delete operation file: ${error.message}`));
  }
}

export async function allOps(tableName: string): Promise<void> {
  await createOps(tableName);
  await readOps(tableName);
  await updateOps(tableName);
  await deleteOps(tableName);
  console.log(chalk.green(`All CRUD operation files generated for table: ${tableName}`));
}