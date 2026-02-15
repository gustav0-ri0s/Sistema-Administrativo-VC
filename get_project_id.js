
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

const url = process.env.VITE_SUPABASE_URL;
if (url) {
    const projectId = url.split('//')[1].split('.')[0];
    console.log(`Project ID: ${projectId}`);
} else {
    console.log("URL not found");
}
