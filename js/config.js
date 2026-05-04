const APP_CONFIG = {
  APP_NAME: 'MaintFlow',
  DB_KEY: 'vkr_pro_db_v1',
  SYNC_EVERY_MS: 5000,
  INACTIVITY_LOGOUT_MS: 30 * 60 * 1000,

  SUPABASE_URL: 'https://avrjslhjckekhjuitkuo.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_Q57UTc8C3EVY5zIoldLcxQ_e_niNb5p'
};

const sb = window.supabase.createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);