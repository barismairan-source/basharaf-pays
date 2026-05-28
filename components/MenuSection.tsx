'use client';

import { useLanguage } from '@/lib/i18n';
import type { MenuSection as MenuSectionType } from '@/lib/menu-data';
import { MenuItem } from './MenuItem';

export function MenuSection({ section }: { section: MenuSectionType }) {
  const { pick } = useLanguage();
  const label = pick(section.label_en, section.label_fa);
  const eyebrow = pick('— Menu', '— منو');

  if (section.items.length === 0) return null;

  return (
    <section className="mt-16 first:mt-0 sm:mt-20">
      <header className="mb-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
          {label}
        </h2>
      </header>

      <div className="mt-6 border-t border-border">
        <ul className="divide-y divide-border">
          {section.items.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
}
