const en = () => import('./dictionaries/en.json').then((module) => module.default)

export type Dictionary = Awaited<ReturnType<typeof en>>

const dictionaries: Record<'en', () => Promise<Dictionary>> = {
  en,
};

export type Locales = keyof typeof dictionaries;

export const locales: Locales[] = Object.keys(dictionaries) as Locales[];
 
export async function getDictionary(locale: Locales) {
  return dictionaries[locale]();
}
