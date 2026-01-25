import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase設定
// 注意: Publishable keyは公開可能（RLSで保護されている前提）
const SUPABASE_URL = 'https://lrlsctxrkhqebvcamfno.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WXbLts2qrJ6Tu4akYijNwA_r-ZSiJLS';

// Supabaseクライアント作成
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 接続テスト用関数
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('books').select('count').limit(1);
    // テーブルがまだない場合もエラーになるが、接続自体は成功
    if (error && !error.message.includes('does not exist')) {
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Supabase connection failed:', e);
    return false;
  }
}
