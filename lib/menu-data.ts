import { getSupabase } from './supabase';

/** A category section on the menu. */
export interface MenuCategory {
  id: string;
  slug: string;
  label_en: string;
  label_fa: string;
  sort_order: number;
}

/** A single dish, drink, etc. */
export interface MenuItem {
  id: string;
  category_id: string;
  title_en: string;
  title_fa: string;
  description_en: string;
  description_fa: string;
  /** Stored as numeric in Postgres → number in JS. Plain Toman. */
  price: number;
  is_available: boolean;
  sort_order: number;
}

/** Categories joined with their items, in display order. */
export interface MenuSection extends MenuCategory {
  items: MenuItem[];
}

/**
 * Fetch the whole menu in one round-trip and group it client-side.
 * Two cheap selects beat a nested join here because we need both
 * lists separately in the admin panel anyway, and PostgREST nested
 * embedding adds noise to the response shape.
 */
export async function fetchMenu(): Promise<MenuSection[]> {
  const supabase = getSupabase();

  const [categoriesRes, itemsRes] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('id, slug, label_en, label_fa, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('menu_items')
      .select(
        'id, category_id, title_en, title_fa, description_en, description_fa, price, is_available, sort_order',
      )
      .order('sort_order', { ascending: true }),
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (itemsRes.error) throw itemsRes.error;

  const categories = (categoriesRes.data ?? []) as MenuCategory[];
  const items = (itemsRes.data ?? []) as MenuItem[];

  // Bucket items by category_id; preserve sort_order from the query.
  const buckets = new Map<string, MenuItem[]>();
  for (const item of items) {
    if (!buckets.has(item.category_id)) buckets.set(item.category_id, []);
    buckets.get(item.category_id)!.push(item);
  }

  return categories.map((cat) => ({
    ...cat,
    items: buckets.get(cat.id) ?? [],
  }));
}

// ─── Admin CRUD ───────────────────────────────────────────────────
// These functions all rely on RLS — they'll fail if called without an
// authenticated session. The admin panel signs in before calling them.

export async function createItem(input: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('menu_items')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as MenuItem;
}

export async function updateItem(
  id: string,
  patch: Partial<Omit<MenuItem, 'id'>>,
): Promise<MenuItem> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('menu_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MenuItem;
}

export async function deleteItem(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleAvailability(
  id: string,
  isAvailable: boolean,
): Promise<void> {
  await updateItem(id, { is_available: isAvailable });
}

// ─── Settings ─────────────────────────────────────────────────────

export interface MenuSettings {
  fa_font: string;
  phone: string;
  address_fa: string;
  address_en: string;
  instagram: string;
}

export async function fetchSettings(): Promise<MenuSettings> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('menu_settings')
    .select('fa_font, phone, address_fa, address_en, instagram')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data as MenuSettings;
}

export async function updateSettings(
  patch: Partial<MenuSettings>,
): Promise<MenuSettings> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('menu_settings')
    .update(patch)
    .eq('id', 1)
    .select('fa_font, phone, address_fa, address_en, instagram')
    .single();
  if (error) throw error;
  return data as MenuSettings;
}

// ─── Category CRUD ────────────────────────────────────────────────

export async function createCategory(
  input: Omit<MenuCategory, 'id'>,
): Promise<MenuCategory> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('menu_categories')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as MenuCategory;
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<MenuCategory, 'id'>>,
): Promise<MenuCategory> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('menu_categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MenuCategory;
}

/**
 * Delete a category. Items reference categories with ON DELETE RESTRICT,
 * so this throws if the category still has items — callers should warn
 * the user to move/delete items first.
 */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('menu_categories').delete().eq('id', id);
  if (error) throw error;
}
