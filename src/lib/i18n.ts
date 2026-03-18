import en from "../../i18n/en.json";
import sv from "../../i18n/sv.json";

const translations: Record<string, Record<string, string>> = {
    en,
    sv,
};

export function t(key: string, lang: string = "sv", replacements?: Record<string, string | number>): string {
    const dict = translations[lang] || translations["sv"];
    let text = dict[key] || translations["sv"][key] || key;
    
    if (replacements) {
        Object.entries(replacements).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, String(v));
        });
    }
    
    return text;
}

export type Language = "en" | "sv";
