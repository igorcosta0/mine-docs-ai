import { supabase } from "@/integrations/supabase/client";

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireAuth(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

export async function signOut() {
  await supabase.auth.signOut();
}
