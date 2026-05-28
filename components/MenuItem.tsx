'use client';

import { useLanguage } from '@/lib/i18n';
import type { MenuItem as MenuItemType } from '@/lib/menu-data';

export function MenuItem({ item }: { item: MenuItemType }) {
  const { pick, formatPrice } = useLanguage();

  const title = pick(item.title_en, item.title_fa);
  const description = pick(item.description_en, item.description_fa);
  const unavailableLabel = pick('unavailable', 'موجود نیست');
  const sold = !item.is_available;

  return (
    <li
      className={[
        'group py-5 transition-opacity duration-200',
        sold ? 'opacity-50' : 'opacity-100',
      ].join(' ')}
      aria-disabled={sold || undefined}
    >
      <div className="flex items-baseline gap-3">
        <h3 className="flex-1 text-lg leading-snug text-foreground">
          <span className={sold ? 'line-through decoration-1' : undefined}>
            {title}
          </span>
          {sold && (
            <span className="ms-2 align-middle text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {unavailableLabel}
            </span>
          )}
        </h3>

        <span
          aria-hidden
          className="hidden flex-1 translate-y-[-3px] border-b border-dotted border-border sm:block"
        />

        <span
          className={[
            'tabular-nums text-lg text-foreground',
            sold ? 'line-through decoration-1' : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {formatPrice(item.price)}
        </span>
      </div>

      {description && (
        <p className="mt-1.5 max-w-[55ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </li>
  );
}
