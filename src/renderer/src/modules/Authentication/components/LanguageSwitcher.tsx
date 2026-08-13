import i18next from 'i18next';
import { assetsBase } from '@web/config';

const LANGUAGES = [
  { code: 'en', flag: `${assetsBase}assets/en.svg` },
  { code: 'fr', flag: `${assetsBase}assets/fr.svg` },
  { code: 'ar', flag: `${assetsBase}assets/ar.svg` },
];

const LanguageSwitcher = () => (
  <div className="mt-7 flex items-center justify-center gap-2">
    {LANGUAGES.map(({ code, flag }) => (
      <button
        key={code}
        onClick={() => {
          i18next.changeLanguage(code);
          location.reload();
        }}
        className={`
          p-1.5 rounded-full transition-all duration-200
          ${i18next.language === code
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
            : 'opacity-50 hover:opacity-100'
          }
        `}
      >
        <img src={flag} alt={code} className="w-7 h-7 rounded-full object-cover" />
      </button>
    ))}
  </div>
);

export default LanguageSwitcher;
