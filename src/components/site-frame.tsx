import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getNavCategories, getStoreSettings } from "@/lib/catalog";
import type { PublicUser } from "@/types/commerce";

export async function SiteFrame({
  children,
  user,
}: {
  children: ReactNode;
  user: PublicUser | null;
}) {
  const [settings, categories] = await Promise.all([getStoreSettings(), getNavCategories()]);

  return (
    <div data-theme={settings.themeMode} className="min-h-screen bg-background text-foreground">
      <div className="bg-sage px-4 py-2 text-center text-[11px] uppercase leading-5 tracking-[0.16em] text-alabaster">
        {settings.announcementBarText}
      </div>
      <SiteHeader
        categories={categories}
        user={user}
        currency={settings.currencySymbol}
        email={settings.supportEmail}
        phone={settings.supportPhone}
        settings={settings}
      />
      <main className="min-w-0 overflow-x-hidden">{children}</main>
      <SiteFooter settings={settings} categories={categories} />
    </div>
  );
}
