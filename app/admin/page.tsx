'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BodyClass } from '@/components/BodyClass';
import { getSupabase } from '@/lib/supabase';
import {
  createItem,
  createCategory,
  deleteCategory,
  deleteItem,
  fetchMenu,
  fetchSettings,
  toggleAvailability,
  updateCategory,
  updateItem,
  updateSettings,
  type MenuCategory,
  type MenuItem,
  type MenuSection,
  type MenuSettings,
} from '@/lib/menu-data';
import { FA_FONTS } from '@/lib/fonts';

/**
 * Admin panel for SAFASITI BA SHARAF menu.
 *
 * Auth: Supabase Auth, email+password. The admin user(s) are created in
 * the Supabase dashboard (Authentication → Users → Add user). There's no
 * sign-up flow exposed here — only an existing user can sign in.
 *
 * UI is Persian-only by design: only restaurant staff use this page.
 */
export default function AdminPage() {
  // undefined = checking, null = logged out, Session = logged in
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <BodyClass className="is-admin" />
      <div dir="rtl" lang="fa" className="min-h-screen bg-background">
        {session === undefined && <CheckingAuth />}
        {session === null && <LoginScreen />}
        {session !== null && session !== undefined && <AdminDashboard />}
      </div>
    </>
  );
}

// ─── Auth states ─────────────────────────────────────────────────

function CheckingAuth() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      در حال بررسی ورود…
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8 shadow-popover">
        <h1 className="text-2xl text-foreground">ورود ادمین</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          صفاسیتی با شرافت — پنل مدیریت منو
        </p>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm text-foreground">ایمیل</span>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-sm text-foreground">رمز عبور</span>
            <input
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>

          {error && (
            <p className="text-xs text-[hsl(var(--danger))]">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !email || !password}
            className="mt-2 w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {busy ? 'در حال ورود…' : 'ورود'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────

function AdminDashboard() {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState<MenuCategory | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMenu();
      setSections(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categories = useMemo<MenuCategory[]>(
    () => sections.map(({ items: _items, ...cat }) => cat),
    [sections],
  );

  const [tab, setTab] = useState<'items' | 'categories' | 'settings'>('items');

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
  };

  const handleToggle = async (item: MenuItem) => {
    await toggleAvailability(item.id, !item.is_available);
    await refresh();
  };

  const handleDelete = async (item: MenuItem) => {
    const title = item.title_fa || item.title_en;
    if (!window.confirm(`«${title}» را حذف می‌کنی؟ این کار قابل بازگشت نیست.`)) {
      return;
    }
    await deleteItem(item.id);
    await refresh();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-2xl text-foreground">پنل منو</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            صفاسیتی با شرافت
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/qr"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            کد QR
          </a>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            دیدن منوی پابلیک
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            خروج
          </button>
        </div>
      </header>

      {/* ─── Tabs ────────────────────────────────────────────── */}
      <nav className="mt-6 flex gap-1 border-b border-border">
        {([
          ['items', 'آیتم‌ها'],
          ['categories', 'دسته‌بندی‌ها'],
          ['settings', 'تنظیمات'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              'relative px-4 py-2.5 text-sm transition-colors',
              tab === key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {label}
            {tab === key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </nav>

      {loading && (
        <p className="py-12 text-center text-muted-foreground">
          در حال بارگذاری…
        </p>
      )}

      {error && (
        <p className="py-12 text-center text-sm text-[hsl(var(--danger))]">
          خطا: {error}
        </p>
      )}

      {!loading && !error && tab === 'items' && (
        <div className="mt-8 space-y-12">
          {sections.map((section) => (
            <section key={section.id}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-foreground">{section.label_fa}</h2>
                <button
                  type="button"
                  onClick={() =>
                    setCreating({
                      id: section.id,
                      slug: section.slug,
                      label_en: section.label_en,
                      label_fa: section.label_fa,
                      sort_order: section.sort_order,
                    })
                  }
                  className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                >
                  <span className="sm:hidden">+ افزودن</span>
                  <span className="hidden sm:inline">+ افزودن به {section.label_fa}</span>
                </button>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted text-xs text-muted-foreground">
                    <tr>
                      <th className="p-3 text-start font-normal">عنوان</th>
                      <th className="p-3 text-start font-normal">English</th>
                      <th className="p-3 text-start font-normal">قیمت</th>
                      <th className="p-3 text-start font-normal">وضعیت</th>
                      <th className="p-3 text-start font-normal">عمل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {section.items.map((item) => (
                      <tr key={item.id} className={item.is_available ? '' : 'opacity-60'}>
                        <td className="p-3 text-foreground">{item.title_fa}</td>
                        <td className="p-3 text-muted-foreground" dir="ltr">
                          {item.title_en}
                        </td>
                        <td className="p-3 text-foreground tabular-nums">
                          {item.price}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(item)}
                            className={[
                              'rounded-full px-2 py-0.5 text-xs',
                              item.is_available
                                ? 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))]'
                                : 'bg-[hsl(var(--danger-subtle))] text-[hsl(var(--danger))]',
                            ].join(' ')}
                          >
                            {item.is_available ? 'موجود' : 'ناموجود'}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditing(item)}
                              className="text-xs text-foreground underline-offset-2 hover:underline"
                            >
                              ویرایش
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="text-xs text-[hsl(var(--danger))] underline-offset-2 hover:underline"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {section.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                          هنوز آیتمی در این دسته نیست
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {!loading && !error && tab === 'categories' && (
        <CategoriesPanel categories={categories} onChanged={refresh} />
      )}

      {!loading && !error && tab === 'settings' && <SettingsPanel />}

      {editing && (
        <EditDialog
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}

      {creating && (
        <EditDialog
          item={null}
          presetCategory={creating}
          categories={categories}
          onClose={() => setCreating(null)}
          onSaved={async () => {
            setCreating(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Add/Edit dialog ─────────────────────────────────────────────

function EditDialog({
  item,
  presetCategory,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItem | null;
  presetCategory?: MenuCategory;
  categories: MenuCategory[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isCreate = item === null;
  const [form, setForm] = useState({
    category_id: item?.category_id ?? presetCategory?.id ?? categories[0]?.id ?? '',
    title_fa: item?.title_fa ?? '',
    title_en: item?.title_en ?? '',
    description_fa: item?.description_fa ?? '',
    description_en: item?.description_en ?? '',
    price: item?.price ?? 0,
    is_available: item?.is_available ?? true,
    sort_order: item?.sort_order ?? 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isCreate) {
        await createItem(form);
      } else {
        await updateItem(item!.id, form);
      }
      await onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape, and lock body scroll while the modal is open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-background p-6 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl text-foreground">
          {isCreate ? 'افزودن آیتم جدید' : 'ویرایش آیتم'}
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="عنوان فارسی">
            <input
              type="text"
              value={form.title_fa}
              onChange={(e) => setForm({ ...form, title_fa: e.target.value })}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>

          <Field label="Title (English)">
            <input
              type="text"
              dir="ltr"
              value={form.title_en}
              onChange={(e) => setForm({ ...form, title_en: e.target.value })}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>

          <Field label="توضیح فارسی">
            <textarea
              value={form.description_fa}
              onChange={(e) =>
                setForm({ ...form, description_fa: e.target.value })
              }
              rows={2}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>

          <Field label="Description (English)">
            <textarea
              dir="ltr"
              value={form.description_en}
              onChange={(e) =>
                setForm({ ...form, description_en: e.target.value })
              }
              rows={2}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>

          <Field label="قیمت (تومان)">
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) || 0 })
              }
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-foreground"
            />
          </Field>

          <Field label="دسته">
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: e.target.value })
              }
              className="block w-full appearance-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label_fa}
                </option>
              ))}
            </select>
          </Field>

          <Field label="ترتیب نمایش">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) || 0 })
              }
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-foreground"
            />
          </Field>

          <Field label="وضعیت">
            <label className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) =>
                  setForm({ ...form, is_available: e.target.checked })
                }
                className="h-4 w-4"
              />
              <span className="text-sm text-foreground">موجود</span>
            </label>
          </Field>
        </div>

        {error && (
          <p className="mt-4 text-xs text-[hsl(var(--danger))]">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره…' : 'ذخیره'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// ─── Categories panel ─────────────────────────────────────────────

function CategoriesPanel({
  categories,
  onChanged,
}: {
  categories: MenuCategory[];
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (cat: MenuCategory) => {
    if (
      !window.confirm(
        `دستهٔ «${cat.label_fa}» را حذف می‌کنی؟ اگر آیتمی در این دسته باشد، حذف نمی‌شود.`,
      )
    ) {
      return;
    }
    try {
      await deleteCategory(cat.id);
      setError(null);
      await onChanged();
    } catch {
      setError(
        'این دسته آیتم دارد و نمی‌توان حذفش کرد. اول آیتم‌ها را به دستهٔ دیگری منتقل یا حذف کن.',
      );
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-foreground">دسته‌بندی‌ها</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
        >
          + دستهٔ جدید
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-[hsl(var(--danger-subtle))] p-3 text-xs text-[hsl(var(--danger))]">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="p-3 text-start font-normal">نام فارسی</th>
              <th className="p-3 text-start font-normal">English</th>
              <th className="p-3 text-start font-normal">ترتیب</th>
              <th className="p-3 text-start font-normal">عمل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="p-3 text-foreground">{cat.label_fa}</td>
                <td className="p-3 text-muted-foreground" dir="ltr">
                  {cat.label_en}
                </td>
                <td className="p-3 text-foreground tabular-nums">
                  {cat.sort_order}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(cat)}
                      className="text-xs text-foreground underline-offset-2 hover:underline"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="text-xs text-[hsl(var(--danger))] underline-offset-2 hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                  هنوز دسته‌ای نیست
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <CategoryDialog
          category={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={async () => {
            setEditing(null);
            setCreating(false);
            await onChanged();
          }}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: MenuCategory | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const isCreate = category === null;
  const [form, setForm] = useState({
    slug: category?.slug ?? '',
    label_fa: category?.label_fa ?? '',
    label_en: category?.label_en ?? '',
    sort_order: category?.sort_order ?? 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    // Auto-generate a slug from English label if empty.
    const slug =
      form.slug.trim() ||
      form.label_en.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
      `cat-${Date.now()}`;

    setSaving(true);
    setError(null);
    try {
      if (isCreate) {
        await createCategory({ ...form, slug });
      } else {
        await updateCategory(category!.id, { ...form, slug });
      }
      await onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl text-foreground">
          {isCreate ? 'دستهٔ جدید' : 'ویرایش دسته'}
        </h2>

        <div className="mt-5 space-y-4">
          <Field label="نام فارسی">
            <input
              type="text"
              value={form.label_fa}
              onChange={(e) => setForm({ ...form, label_fa: e.target.value })}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>
          <Field label="Label (English)">
            <input
              type="text"
              dir="ltr"
              value={form.label_en}
              onChange={(e) => setForm({ ...form, label_en: e.target.value })}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>
          <Field label="ترتیب نمایش (عدد کوچک‌تر = بالاتر)">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm({ ...form, sort_order: Number(e.target.value) || 0 })
              }
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm tabular-nums outline-none focus:border-foreground"
            />
          </Field>
        </div>

        {error && <p className="mt-4 text-xs text-[hsl(var(--danger))]">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.label_fa}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره…' : 'ذخیره'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings panel (font + contact info) ─────────────────────────

function SettingsPanel() {
  const [settings, setSettings] = useState<MenuSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await updateSettings(settings);
      setSavedAt(Date.now());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="mt-8 text-center text-muted-foreground">در حال بارگذاری…</p>;
  }
  if (!settings) {
    return (
      <p className="mt-8 text-center text-sm text-[hsl(var(--danger))]">
        خطا در بارگذاری تنظیمات{error ? `: ${error}` : ''}
      </p>
    );
  }

  return (
    <div className="mt-8 max-w-xl space-y-8">
      {/* Font picker */}
      <section>
        <h2 className="text-xl text-foreground">فونت منو (فارسی)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          فونتی که در صفحهٔ منو برای متن فارسی استفاده می‌شود.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FA_FONTS.map((font) => (
            <button
              key={font.key}
              type="button"
              onClick={() => setSettings({ ...settings, fa_font: font.key })}
              className={[
                'rounded-lg border p-4 text-center transition-colors',
                settings.fa_font === font.key
                  ? 'border-foreground bg-muted'
                  : 'border-border hover:border-muted-foreground',
              ].join(' ')}
            >
              <span className="text-sm text-foreground">{font.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Contact info */}
      <section>
        <h2 className="text-xl text-foreground">اطلاعات تماس</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          در پایین صفحهٔ منو نمایش داده می‌شود. خالی بگذاری، نمایش داده نمی‌شود.
        </p>
        <div className="mt-4 space-y-4">
          <Field label="شمارهٔ تماس">
            <input
              type="text"
              dir="ltr"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="021-..."
            />
          </Field>
          <Field label="آدرس (فارسی)">
            <input
              type="text"
              value={settings.address_fa}
              onChange={(e) =>
                setSettings({ ...settings, address_fa: e.target.value })
              }
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>
          <Field label="Address (English)">
            <input
              type="text"
              dir="ltr"
              value={settings.address_en}
              onChange={(e) =>
                setSettings({ ...settings, address_en: e.target.value })
              }
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </Field>
          <Field label="اینستاگرام (بدون @)">
            <input
              type="text"
              dir="ltr"
              value={settings.instagram}
              onChange={(e) =>
                setSettings({ ...settings, instagram: e.target.value })
              }
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="safasiti"
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {saving ? 'در حال ذخیره…' : 'ذخیرهٔ تنظیمات'}
        </button>
        {savedAt && !saving && (
          <span className="text-sm text-[hsl(var(--success))]">ذخیره شد ✓</span>
        )}
        {error && <span className="text-sm text-[hsl(var(--danger))]">{error}</span>}
      </div>
    </div>
  );
}
