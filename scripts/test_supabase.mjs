import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://czriatollbnjycispbap.supabase.co';
const key = 'sb_publishable_21nWAISuO9F0z_RAO7hkiA_FUfYPA36';

const supabase = createClient(url, key);

async function checkAndMigrate() {
  console.log('Testing Supabase connection...');
  const { data, error } = await supabase.from('comments').select('id').limit(1);
  if (error) {
    console.error('Error accessing comments table:', error.message);
    if (error.code === '42P01') {
      console.error('Table "comments" does not exist. You need to create it in Supabase Dashboard.');
    } else if (error.code === 'PGRST301') {
       console.error('RLS policy issue. Table exists but RLS blocks SELECT.');
    }
  } else {
    console.log('Table exists and is accessible. Data:', data);
    
    // Read comments.json
    try {
      const commentsRaw = fs.readFileSync('comments.json', 'utf8');
      const comments = JSON.parse(commentsRaw);
      console.log(`Found ${comments.length} comments in local JSON.`);
      
      const { error: insertError } = await supabase.from('comments').upsert(
        comments.map(c => ({
          id: c.id,
          username: c.username,
          text: c.text,
          photo_base64: c.photoBase64,
          timestamp: c.timestamp
        }))
      );
      
      if (insertError) {
        console.error('Failed to migrate data:', insertError.message);
      } else {
        console.log('Successfully migrated data to Supabase!');
      }
    } catch (e) {
      console.log('No comments.json or failed to parse:', e.message);
    }
  }
}

checkAndMigrate();
