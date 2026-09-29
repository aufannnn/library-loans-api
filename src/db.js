const { createClient } = require('@supabase/supabase-js');

let client;

function getDb() {
  if (!client) {
    const { SUPABASE_URL, SUPABASE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('SUPABASE_URL dan SUPABASE_KEY belum di-set');
    }
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

module.exports = { getDb };