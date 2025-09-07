'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // Import usePathname and useSearchParams
import { useTranslation } from 'next-i18next';
import { supportedLngs } from '@/lib/i18n'; // Import supportedLngs
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const searchParams = useSearchParams(); // Get current search params
  const { i18n } = useTranslation();

  const handleLanguageChange = (newLocale: string) => {
    // Construct the new URL with the updated locale
    const newUrl = new URL(window.location.href);
    newUrl.pathname = pathname; // Ensure pathname is correct
    newUrl.search = searchParams.toString(); // Preserve existing search params

    // This is a simplified approach. For full i18n routing in App Router,
    // you'd typically have a [lang] segment in your routes.
    // Since we don't have that, we'll rely on next-i18next's
    // language detection and router.refresh() to trigger a re-render
    // with the new language.

    // Set the language in i18n instance
    i18n.changeLanguage(newLocale);

    // Refresh the page to apply the new language
    router.refresh();
  };

  return (
    <Select onValueChange={handleLanguageChange} value={i18n.language}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {supportedLngs.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {locale === 'en' ? 'English' : locale === 'id' ? 'Bahasa Indonesia' : locale.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
