// Creates (or promotes) an admin account for the NOIR FASHION dashboard.
// Usage:  npm run create-admin -- you@example.com "a-strong-password"
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
// The service_role key stays on your computer — never add it to Vercel or GitHub.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const [email, password] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error('Gebruik: npm run create-admin -- jij@voorbeeld.nl "sterk-wachtwoord"');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Kies een wachtwoord van minimaal 10 tekens.");
  process.exit(1);
}
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY ontbreken in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

let userId;
const { data: created, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  // Already exists? Look the user up and just grant admin rights.
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) { console.error("Account aanmaken mislukt:", error.message); process.exit(1); }
  userId = existing.id;
  console.log("Account bestond al — beheerdersrechten worden toegekend (wachtwoord is niet gewijzigd).");
} else {
  userId = created.user.id;
}

const { error: adminError } = await supabase.from("admin_users").upsert({ user_id: userId, email });
if (adminError) { console.error("Beheerdersrechten toekennen mislukt:", adminError.message); process.exit(1); }
console.log(`✓ ${email} is nu beheerder. Log in op /admin/login`);
