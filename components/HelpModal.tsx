import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const sectionTitleClass = 'font-bangers text-xl text-comic-purple tracking-wide mb-2';
const entryClass = 'flex gap-2 leading-relaxed';

const QUICK_START_STEPS: Array<{ titleKey: TranslationKey; textKey: TranslationKey }> = [
  { titleKey: 'help.step1.title', textKey: 'help.step1.text' },
  { titleKey: 'help.step2.title', textKey: 'help.step2.text' },
  { titleKey: 'help.step3.title', textKey: 'help.step3.text' },
  { titleKey: 'help.step4.title', textKey: 'help.step4.text' },
];

export const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('help.title')}
    >
      <div
        className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bangers text-3xl text-comic-purple tracking-wide">{t('help.title')}</h2>
          <button
            onClick={onClose}
            aria-label={t('help.close')}
            className="p-2 border-2 border-black rounded-lg hover:bg-comic-yellow shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-7 text-sm md:text-base font-comic text-slate-700 leading-relaxed">
          {/* Quick start */}
          <section>
            <h3 className={sectionTitleClass}>{t('help.quickStart.title')}</h3>
            <ol className="space-y-2">
              {QUICK_START_STEPS.map((step) => (
                <li key={step.titleKey}>
                  <strong className="text-slate-900">{t(step.titleKey)}</strong>
                  <span> {t(step.textKey)}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Options explained */}
          <section>
            <h3 className={sectionTitleClass}>{t('help.params.title')}</h3>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-slate-900">{t('help.param.scriptModel')}</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>{t('help.param.scriptModel.gemini')}</li>
                  <li>{t('help.param.scriptModel.gpt55')}</li>
                  <li>{t('help.param.scriptModel.gpt56')}</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-slate-900">{t('help.param.artStyle')}</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>{t('help.param.artStyle.comic')}</li>
                  <li>{t('help.param.artStyle.manga')}</li>
                  <li>{t('help.param.artStyle.noir')}</li>
                  <li>{t('help.param.artStyle.watercolor')}</li>
                  <li>{t('help.param.artStyle.cartoon')}</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-slate-900">{t('help.param.imageModel')}</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>{t('help.param.imageModel.gpt2')}</li>
                  <li>{t('help.param.imageModel.gpt2_4k')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Script editing */}
          <section>
            <h3 className={sectionTitleClass}>{t('help.editing.title')}</h3>
            <p className="mb-2">{t('help.editing.intro')}</p>
            <ul className="space-y-1.5">
              <li className={entryClass}>
                <span aria-hidden>📝</span>
                <span>{t('help.field.title')}</span>
              </li>
              <li className={entryClass}>
                <span aria-hidden>🏷️</span>
                <span>{t('help.field.caption')}</span>
              </li>
              <li className={entryClass}>
                <span aria-hidden>💬</span>
                <span>{t('help.field.speaker')}</span>
              </li>
              <li className={entryClass}>
                <span aria-hidden>🗣️</span>
                <span>{t('help.field.dialogue')}</span>
              </li>
              <li className={entryClass}>
                <span aria-hidden>🎨</span>
                <span>{t('help.field.visualPrompt')}</span>
              </li>
            </ul>
          </section>

          {/* Troubleshooting */}
          <section>
            <h3 className={sectionTitleClass}>{t('help.faq.title')}</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>{t('help.faq.geminiKey')}</li>
              <li>{t('help.faq.rateLimit')}</li>
              <li>{t('help.faq.keyNotSet')}</li>
              <li>{t('help.faq.keys')}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
