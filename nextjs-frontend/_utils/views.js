export function setViewsCount(views_count) {
    if (views_count > 1000000){
        const x = parseInt(views_count / 1000000);
        return `${x}Mil`;
    }
    else if(views_count > 1000){
        const x = parseInt(views_count / 1000);
        return `${x}k`
    }
    else{
        return `${views_count}`
    }
}

export function getFlagEmoji(langCode) {
  const flags = {
    en: "🇬🇧",
    ro: "🇷🇴",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    unknown: "🌐"
  };

  return flags[langCode?.toLowerCase()] || "🌐";
}

// utils/getFlagUrl.js

export function getFlagUrl(langCode) {
  const map = {
    en: "gb", // British flag
    ro: "ro",
    es: "es",
    fr: "fr",
    de: "de",
    it: "it",
  };

  const code = map[langCode?.toLowerCase()];
  return code
    ? `https://flagcdn.com/240x180/${code}.png`
    : null; // fallback for "unknown"
}
