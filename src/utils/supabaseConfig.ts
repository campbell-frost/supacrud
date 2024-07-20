import fs from 'fs';
import path from 'path';
import os from 'os';
import toml from 'toml';
import axios from 'axios';

function getSupabaseConfig() {
  const homeDir = os.homedir();
  const projectConfigPath = path.join(process.cwd(), 'supabase', 'config.toml');
  
  if (!fs.existsSync(projectConfigPath)) {
    throw new Error('Supabase config not found. Please run "npx supabase init" first.');
  }
  
  const configContent = fs.readFileSync(projectConfigPath, 'utf-8');
  const config = toml.parse(configContent);
  const projectRef = config.project_id;
  
  if (!projectRef) {
    throw new Error('Project reference not found in config.toml');
  }
  
  const accessTokenPath = path.join(homeDir, '.supabase', 'access-token');
  
  if (!fs.existsSync(accessTokenPath)) {
    throw new Error('Supabase access token not found. Please run "npx supabase login" first.');
  }
  
  const accessToken = fs.readFileSync(accessTokenPath, 'utf-8').trim();
  return { projectRef, accessToken };
}

async function getProjectDetails() {
  try {
    console.log('Starting getProjectDetails function');
    const { projectRef, accessToken } = getSupabaseConfig();
    console.log('Project Ref:', projectRef);
    console.log('Access Token:', accessToken.substring(0, 10) + '...'); 

    const response = await axios.get(`https://api.supabase.com/v1/projects/${projectRef}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const project = response.data;
    console.log('Project Data:', JSON.stringify(project, null, 2));

    const returnData = {
      projectUrl: `https://${project.ref}.supabase.co`,
      apiKey: project.anon_key
    };
    console.log('Return Data:', returnData);
    return returnData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Failed to fetch project details:', error.response?.status, error.response?.data);
    } else {
      console.error('Failed to fetch project details:', error);
    }
    throw error;
  }
}

export { getSupabaseConfig, getProjectDetails };