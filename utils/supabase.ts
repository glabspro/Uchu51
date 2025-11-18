
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fkvmstannsdpnoeikahy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdm1zdGFubnNkcG5vZWlrYWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDE2MjksImV4cCI6MjA3OTA3NzYyOX0.OEJtIzCAUcTV7-9MA4rVn0W4UeyVMAu8EqX1TZI1pb0';

export const supabase = createClient(supabaseUrl, supabaseKey);
