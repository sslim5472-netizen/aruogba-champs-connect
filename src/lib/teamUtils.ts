import airwayLogo from "@/assets/airway-fc.jpg";
import knightsLogo from "@/assets/knights-fc.jpg";
import starsLogo from "@/assets/stars-fc.jpg";
import spartaLogo from "@/assets/sparta-fc.jpg";
import kingsLogo from "@/assets/kings-fc.jpg";
import enjoymentLogo from "@/assets/enjoyment-fc.jpg";

const localLogoMap: Record<string, string> = {
  'airway-fc': airwayLogo,
  'knights-fc': knightsLogo,
  'stars-fc': starsLogo,
  'sparta-fc': spartaLogo,
  'kings-fc': kingsLogo,
  'enjoyment-fc': enjoymentLogo,
};

const toTeamSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');
const isValidUrl = (s?: string | null) => Boolean(s && /^https?:\/\//.test(s));

export const getTeamLogo = (teamName: string, logoUrl?: string | null) => {
  // Prioritize logo_url from database if it's a valid HTTP URL
  if (isValidUrl(logoUrl)) {
    return logoUrl as string;
  }
  
  // Fallback to local assets based on team name slug
  const slug = toTeamSlug(teamName);
  const localLogo = localLogoMap[slug];
  
  if (localLogo) {
    return localLogo;
  }

  // Final fallback to a generic placeholder
  return '/placeholder.svg';
};