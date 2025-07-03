import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://onpnbalsenwkckgwrvaz.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucG5iYWxzZW53a2NrZ3dydmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1OTM5NDUsImV4cCI6MjA1ODE2OTk0NX0.u1iNx8pWDfBpLaw71RZvSv_aWcCMAM02outmopWGLEc"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
