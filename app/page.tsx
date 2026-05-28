'use client';

import { useEffect, useState } from 'react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { MenuSection } from '@/components/MenuSection';
import { BodyClass } from '@/components/BodyClass';
import { useLanguage } from '@/lib/i18n';
import {
  fetchMenu,
  fetchSettings,
  type MenuSection as MenuSectionType,
  type MenuSettings,
} from '@/lib/menu-data';
import { DEFAULT_FA_FONT } from '@/lib/fonts';

export default function MenuPage() {
  const { pick, mounted } = useLanguage();
  const [sections, setSections] = useState<MenuSectionType[]>([]);
  const [settings, setSettings] = useState<MenuSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMenu(), fetchSettings().catch(() => null)])
      .then(([menu, sett]) => {
        if (cancelled) return;
        setSections(menu);
        setSettings(sett);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply the admin-chosen Persian font by setting data-fa-font on <html>.
  useEffect(() => {
    const font = settings?.fa_font || DEFAULT_FA_FONT;
    document.documentElement.setAttribute('data-fa-font', font);
  }, [settings]);

  const restaurantName = pick('SAFASITI BA SHARAF', 'صفاسیتی با شرافت');
  const tagline = pick('A neighborhood kitchen', 'آشپزخانهٔ محله');
  const footerLine = pick(
    'All prices in Toman. Allergens on request.',
    'قیمت‌ها به تومان است. اطلاعات حساسیت غذایی را از پرسنل بپرسید.',
  );
  const loadingLabel = pick('Loading menu…', 'در حال بارگذاری منو…');
  const errorPrefix = pick("Couldn't load menu: ", 'خطا در بارگذاری منو: ');

  const address = pick(settings?.address_en, settings?.address_fa);

  return (
    <>
      <BodyClass className="is-menu" />
      <main
        className={[
          'min-h-screen bg-background',
          mounted ? 'animate-fade-in' : 'opacity-0',
        ].join(' ')}
      >
        <LanguageToggle />

        <div className="mx-auto max-w-2xl px-6 pb-24 pt-20 sm:px-8 sm:pt-28">
          <header className="border-b border-border pb-10 text-center">
            <h1 className="text-4xl leading-[1.1] text-foreground sm:text-5xl">
              {restaurantName}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              {tagline}
            </p>
          </header>

          <div className="mt-12">
            {loading && (
              <p className="py-20 text-center text-muted-foreground">
                {loadingLabel}
              </p>
            )}
            {error && (
              <p className="py-20 text-center text-sm text-[hsl(var(--danger))]">
                {errorPrefix}
                {error}
              </p>
            )}
            {!loading &&
              !error &&
              sections.map((section) => (
                <MenuSection key={section.id} section={section} />
              ))}
          </div>

          <footer className="mt-24 border-t border-border pt-8 text-center">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {footerLine}
            </p>

            {(settings?.phone || address || settings?.instagram) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {settings?.phone && (
                  <a
                    href={`tel:${settings.phone}`}
                    dir="ltr"
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {settings.phone}
                  </a>
                )}
                {address && <span>{address}</span>}
                {settings?.instagram && (
                  <a
                    href={`https://instagram.com/${settings.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    @{settings.instagram.replace(/^@/, '')}
                  </a>
                )}
              </div>
            )}
          </footer>
        </div>
      </main>
    </>
  );
}
