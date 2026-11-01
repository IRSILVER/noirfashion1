export const SITE_NAME = "NOIR FASHION";
export const SLOGAN = "CURATED LUXURY. TIMELESS STYLE.";
export const SITE_DESCRIPTION =
  "Ontdek een zorgvuldig samengestelde collectie luxe mode, designerkleding en eigentijdse streetwear bij NOIR FASHION.";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const PRIVATE_ARRANGEMENT_TEXT =
  "Na het plaatsen van je bestelling nemen wij persoonlijk contact met je op om de betaling en de levering of afhaling te bespreken.";
