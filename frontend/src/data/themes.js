// --- Gujarat (gj) ---
import gujaratDealer from '../assets/themes/gj-dealer.png';
import gujaratCardBack from '../assets/themes/gj-card-back.png';
import gujaratBgDesktop from '../assets/themes/gj-bg-desktop.png';
import gujaratBgMobile from '../assets/themes/gj-bg-mobile.png';

// --- Rajasthan (rj) ---
import rajasthanDealer from '../assets/themes/rj-dealer.png';
import rajasthanCardBack from '../assets/themes/rj-card-back.png';
import rajasthanBgDesktop from '../assets/themes/rj-bg-desktop.png';
import rajasthanBgMobile from '../assets/themes/rj-bg-mobile.png';

// --- Maharashtra (mh) ---
import maharashtraDealer from '../assets/themes/mh-dealer.png';
import maharashtraCardBack from '../assets/themes/mh-card-back.png';
import maharashtraBgDesktop from '../assets/themes/mh-bg-desktop.png';
import maharashtraBgMobile from '../assets/themes/mh-bg-mobile.png';

// --- Delhi (dl) ---
import delhiDealer from '../assets/themes/dl-dealer.png';
import delhiCardBack from '../assets/themes/dl-card-back.png';
import delhiBgDesktop from '../assets/themes/dl-bg-desktop.png';
import delhiBgMobile from '../assets/themes/dl-bg-mobile.png';

// --- Uttar Pradesh (up) ---
import uttarpradeshDealer from '../assets/themes/up-dealer.png';
import uttarpradeshCardBack from '../assets/themes/up-card-back.png';
import uttarpradeshBgDesktop from '../assets/themes/up-bg-desktop.png';
import uttarpradeshBgMobile from '../assets/themes/up-bg-mobile.png';

// --- Kerala (kl) ---
import keralaDealer from '../assets/themes/kl-dealer.png';
import keralaCardBack from '../assets/themes/kl-card-back.png';
import keralaBgDesktop from '../assets/themes/kl-bg-desktop.png';
import keralaBgMobile from '../assets/themes/kl-bg-mobile.png';

// --- Jammu & Kashmir (jk) ---
import jammukashmirDealer from '../assets/themes/jk-dealer.png';
import jammukashmirCardBack from '../assets/themes/jk-card-back.png';
import jammukashmirBgDesktop from '../assets/themes/jk-bg-desktop.png';
import jammukashmirBgMobile from '../assets/themes/jk-bg-mobile.png';

// --- Kolkata (kk) ---
import kolkataDealer from '../assets/themes/kk-dealer.png';
import kolkataCardBack from '../assets/themes/kk-card-back.png';
import kolkataBgDesktop from '../assets/themes/kk-bg-desktop.png';
import kolkataBgMobile from '../assets/themes/kk-bg-mobile.png';

// --- Assam (as) ---
import assamDealer from '../assets/themes/as-dealer.png';
import assamCardBack from '../assets/themes/as-card-back.png';
import assamBgDesktop from '../assets/themes/as-bg-desktop.png';
import assamBgMobile from '../assets/themes/as-bg-mobile.png';

export const REGIONAL_THEMES = {
  gujarat: {
    name: "Gujarat",
    tagline: "Vibrant Navratri & Heritage",
    dealer: { name: "Amdavadi Host", icon: gujaratDealer, quote: "Kem chho! Chalo dekhte hain kiska kismat chamakti hai!" },
    background: { desktop: gujaratBgDesktop, mobile: gujaratBgMobile },
    cardSkin: { backImage: gujaratCardBack, accentColor: "#f59e0b" }
  },
  rajasthan: {
    name: "Rajasthan",
    tagline: "Land of Kings & Royal Forts",
    dealer: { name: "Rajputana Thakur", icon: rajasthanDealer, quote: "Khamma Ghani Sa! Pधारो sa, dekhte hain kiska daav lagta hai!" },
    background: { desktop: rajasthanBgDesktop, mobile: rajasthanBgMobile },
    cardSkin: { backImage: rajasthanCardBack, accentColor: "#f59e0b" }
  },
  maharashtra: {
    name: "Maharashtra",
    tagline: "Ganpati Bappa Morya & Forts",
    dealer: { name: "Maratha Sardar", icon: maharashtraDealer, quote: "Ganpati Bappa Morya! Aata hoil khari laadai!" },
    background: { desktop: maharashtraBgDesktop, mobile: maharashtraBgMobile },
    cardSkin: { backImage: maharashtraCardBack, accentColor: "#fbbf24" }
  },
  delhi: {
    name: "Delhi",
    tagline: "Dilli 6 & Royal Mughal Heritage",
    dealer: { name: "Dilli Nawab", icon: delhiDealer, quote: "Aaoji! Dilli ke andaz me dekhte hain kaun hai shaan-e-patti!" },
    background: { desktop: delhiBgDesktop, mobile: delhiBgMobile },
    cardSkin: { backImage: delhiCardBack, accentColor: "#f43f5e" }
  },
  uttarpradesh: {
    name: "Uttar Pradesh",
    tagline: "Divine Ayodhya & Taj Heritage",
    dealer: { name: "Ayodhya Pujari", icon: uttarpradeshDealer, quote: "Jai Shri Ram! Shuddh aur sacchi niyat se chuno apna patta!" },
    background: { desktop: uttarpradeshBgDesktop, mobile: uttarpradeshBgMobile },
    cardSkin: { backImage: uttarpradeshCardBack, accentColor: "#fde047" }
  },
  kerala: {
    name: "Kerala",
    tagline: "God's Own Country & Backwaters",
    dealer: { name: "Kerala Host", icon: keralaDealer, quote: "Namaskaram! God's own country me swagat hai." },
    background: { desktop: keralaBgDesktop, mobile: keralaBgMobile },
    cardSkin: { backImage: keralaCardBack, accentColor: "#34d399" }
  },
  jammukashmir: {
    name: "Jammu & Kashmir",
    tagline: "Heaven on Earth & Chinar Valleys",
    dealer: { name: "Kashmiri Malik", icon: jammukashmirDealer, quote: "Assalam-o-Alaikum! Jannat si fiza me chaliye kismat aazmayen." },
    background: { desktop: jammukashmirBgDesktop, mobile: jammukashmirBgMobile },
    cardSkin: { backImage: jammukashmirCardBack, accentColor: "#38bdf8" }
  },
  kolkata: {
    name: "Kolkata (West Bengal)",
    tagline: "City of Joy & Cultural Hub",
    dealer: { name: "Kolkata Babu", icon: kolkataDealer, quote: "Nomoshkar! City of joy me aapka khel shuru hota hai!" },
    background: { desktop: kolkataBgDesktop, mobile: kolkataBgMobile },
    cardSkin: { backImage: kolkataCardBack, accentColor: "#e879f9" }
  },
  assam: {
    name: "Assam",
    tagline: "Land of Red Rivers and Blue Hills",
    dealer: { name: "Assamese Host", icon: assamDealer, quote: "Ayubowan! Let's pour a fresh cup of tea and play!" },
    background: { desktop: assamBgDesktop, mobile: assamBgMobile },
    cardSkin: { backImage: assamCardBack, accentColor: "#10b981" }
  }
};