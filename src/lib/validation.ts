export interface CheckoutInput {
  name: string;
  phone: string;
  snapchat: string;
  email: string;
  notes: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutInput, string>>;

export const normalizePhone = (p: string) => p.replace(/[\s\-.()]/g, "");

/** Same rules as the database function place_order(); runs on client and server. */
export function validateCheckout(input: CheckoutInput): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const name = input.name.trim();
  if (name.length < 2) errors.name = "Vul je volledige naam in.";
  else if (name.length > 100) errors.name = "Je naam mag maximaal 100 tekens bevatten.";

  const phone = normalizePhone(input.phone);
  if (!phone) errors.phone = "Vul je telefoonnummer in.";
  else if (!/^(\+|00)?[0-9]{8,15}$/.test(phone))
    errors.phone = "Vul een geldig telefoonnummer in, bijvoorbeeld 06 12345678.";

  const snap = input.snapchat.trim().replace(/^@/, "");
  if (snap && !/^[A-Za-z][A-Za-z0-9._-]{1,29}$/.test(snap))
    errors.snapchat = "Vul een geldige Snapchat-gebruikersnaam in, of laat dit veld leeg.";

  const email = input.email.trim();
  if (email && (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)))
    errors.email = "Vul een geldig e-mailadres in, of laat dit veld leeg.";

  if (input.notes.trim().length > 1000) errors.notes = "Opmerkingen mogen maximaal 1000 tekens bevatten.";
  return errors;
}

export const ORDER_ERROR_MESSAGES: Record<string, string> = {
  invalid_name: "Vul je volledige naam in.",
  invalid_phone: "Vul een geldig telefoonnummer in.",
  invalid_snapchat: "De Snapchat-gebruikersnaam is ongeldig.",
  invalid_email: "Het e-mailadres is ongeldig.",
  invalid_notes: "Je opmerking is te lang.",
  empty_cart: "Je winkelwagen is leeg.",
  invalid_quantity: "Een van de aantallen is ongeldig.",
  unavailable: "Een van de producten in je winkelwagen is niet meer beschikbaar.",
  insufficient_stock: "Er is niet genoeg voorraad meer van een product in je winkelwagen.",
  server_error: "Er ging iets mis bij het plaatsen van je bestelling. Probeer het opnieuw.",
};
