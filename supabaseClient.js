import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

const supabaseUrl = 'https://eznqoksocpuagbvaswge.supabase.co';
const supabasePublishableKey = 'sb_publishable_HuTd0Go8bbMbUj5mqRRo3w_NCvDiO4e';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
