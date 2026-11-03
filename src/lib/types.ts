export type ProductCondition =
  | "new_with_tags"
  | "new_without_tags"
  | "preowned_excellent"
  | "preowned_good";

export type OrderStatus =
  | "new"
  | "awaiting_confirmation"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "completed"
  | "cancelled";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  header_image_url?: string | null;
  header_storage_path?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  storage_path: string | null;
  alt: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  stock: number;
  price: number | null;
  sale_price: number | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand_id: string | null;
  category_id: string | null;
  condition: ProductCondition;
  price: number;
  sale_price: number | null;
  is_published: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_sold_out: boolean;
  created_at: string;
  updated_at: string;
  brand: Pick<Brand, "id" | "name" | "slug"> | null;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  snapchat: string | null;
  email: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  status: OrderStatus;
  total: number;
  is_seen: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  brand_name: string | null;
  size: string;
  condition: ProductCondition | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface SiteSettings {
  announcement: string | null;
  hero_title: string;
  hero_subtitle: string;
  contact_email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  snapchat: string | null;
  contact_intro: string | null;
}

export interface ContentPage {
  slug: string;
  title: string;
  body: string;
  updated_at: string;
}
