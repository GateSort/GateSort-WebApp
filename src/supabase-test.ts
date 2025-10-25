import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Intenta listar tablas o hacer un simple select
    const { data, error } = await supabase.from('airlines').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error connecting to Supabase:', error);
    } else {
      console.log('✅ Connection successful! Data:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();
