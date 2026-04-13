/** Tipovi baze (Supabase) — dopuniti posle Faze 3. */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
