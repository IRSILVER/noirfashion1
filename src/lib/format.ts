import type { OrderStatus, ProductCondition } from "./types";

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
export const formatPrice = (value: number | string | null | undefined) =>
  euro.format(Number(value ?? 0));

const dateFmt = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam",
});
const dateTimeFmt = new Intl.DateTimeFormat("nl-NL", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new_with_tags: "Nieuw met labels",
  new_without_tags: "Nieuw zonder labels",
  preowned_excellent: "Tweedehands – uitstekende staat",
  preowned_good: "Tweedehands – goede staat",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Nieuwe bestelling",
  awaiting_confirmation: "Wacht op bevestiging",
  awaiting_payment: "Wacht op betaling",
  paid: "Betaald",
  processing: "In behandeling",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
};

export const STATUS_ORDER: OrderStatus[] = [
  "new", "awaiting_confirmation", "awaiting_payment", "paid", "processing", "completed", "cancelled",
];

export const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-noir text-ivory",
  awaiting_confirmation: "bg-champagne/20 text-espresso",
  awaiting_payment: "bg-amber-100 text-amber-900",
  paid: "bg-emerald-100 text-emerald-900",
  processing: "bg-sky-100 text-sky-900",
  completed: "bg-stone-200 text-stone-800",
  cancelled: "bg-red-100 text-red-900",
};

/** Turns a phone number into a wa.me link number (Dutch 06 → 316). */
export function whatsappNumber(phone: string) {
  let n = phone.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "31" + n.slice(1);
  return n;
}
