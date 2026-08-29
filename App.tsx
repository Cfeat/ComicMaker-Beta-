import React from 'react';
import { InputForm } from './components/InputForm';
import { ComicPanel } from './components/ComicPanel';
import { ScriptEditor } from './components/ScriptEditor';
import { HelpModal } from './components/HelpModal';
import { useComicGenerator } from './hooks/useComicGenerator';
import { useTranslation } from './i18n/LanguageContext';
import { BookOpen, Download, Loader2 } from 'lucide-react';
import { IMAGE_MODELS, SCRIPT_MODELS } from './types';

const App: React.FC = () => {
  const { lang, setLang, t } = useTranslation();
  const [helpOpen, setHelpOpen] = React.useState(false);

  const {
    state,
    title,
    panels,
    errorMsg,
    settings,
    isSaving,
    config,
    startGeneration,
    drawPanels,
    regeneratePanel,
    cancel,
    resetAll,
    updateSettings,
    updateTitle,
    updatePanel,
    downloadComic,
  } = useComicGenerator();

  const isStripVisible = panels.length > 0 && (state === 'generating_images' || state === 'complete');
  const hasAnyImage = panels.some((panel) => Boolean(panel.imageData));
  const modelLabel = IMAGE_MODELS.find((entry) => entry.value === settings.model)?.label ?? settings.model;
  const scriptModelLabel = SCRIPT_MODELS.find((entry) => entry.value === settings.scriptModel)?.label ?? settings.scriptModel;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 pb-8 md:pt-8 px-4 font-comic selection:bg-comic-yellow">
      {/* Corner controls: help + language switch */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-1.5 bg-white hover:bg-comic-yellow border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all font-bold text-sm font-sans"
          aria-label={t('controls.help')}
        >
          <BookOpen size={16} />
          <span className="hidden sm:inline">{t('controls.help')}</span>
        </button>
        <div
          className="flex rounded-lg border-2 border-black overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-sans text-sm font-bold"
          role="group"
          aria-label={t('controls.language')}
        >
          <button
            type="button"
            onClick={() => setLang('zh')}
            aria-pressed={lang === 'zh'}
            className={`px-2.5 py-1.5 ${lang === 'zh' ? 'bg-comic-yellow text-black' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            中
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            className={`px-2.5 py-1.5 border-l-2 border-black ${
              lang === 'en' ? 'bg-comic-yellow text-black' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Header */}
      <header className="mb-8 text-center">
        <div className="inline-block relative">
          <h1 className="text-5xl md:text-7xl font-bangers text-comic-purple tracking-wider drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] stroke-black">
            COMICGEN AI
          </h1>
          <div className="absolute -top-6 -right-8 rotate-12 bg-comic-yellow border-2 border-black px-2 py-1 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <span className="font-bold text-xs font-sans">BETA</span>
          </div>
        </div>
        <p className="text-slate-600 mt-4 text-lg max-w-md mx-auto leading-relaxed">{t('header.tagline')}</p>
      </header>

      {/* Input Form */}
      <InputForm onSubmit={startGeneration} onSettingsChange={updateSettings} state={state} onCancel={cancel} config={config} />

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 max-w-2xl w-full" role="alert">
          <p className="font-bold">{t('error.title')}</p>
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Script Review & Edit Step */}
      {state === 'reviewing_script' && panels.length > 0 && (
        <ScriptEditor
          title={title}
          panels={panels}
          onTitleChange={updateTitle}
          onPanelChange={updatePanel}
          onDraw={drawPanels}
          onDiscard={resetAll}
        />
      )}

      {/* Comic Display */}
      {isStripVisible && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-between items-end mb-4 px-2">
            <div>{title && <h2 className="text-3xl font-bangers text-slate-800">{title}</h2>}</div>

            {state === 'complete' && hasAnyImage && (
              <button
                onClick={downloadComic}
                disabled={isSaving}
                className="flex items-center gap-2 bg-white hover:bg-slate-100 border-2 border-black px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isSaving ? t('button.saving') : t('button.save')}
              </button>
            )}
          </div>

          {/* The Comic Grid - ID used for download screenshot */}
          <div
            id="comic-strip-container"
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-slate-50 p-4 md:p-8 border-dashed border-4 border-slate-300 rounded-3xl"
          >
            {panels.map((panel) => (
              <ComicPanel
                key={panel.id}
                panel={panel}
                onRegenerate={regeneratePanel}
                canRegenerate={state === 'complete'}
              />
            ))}
          </div>

          <div className="mt-8 text-center text-slate-400 text-sm font-sans">
            {t('footer.credit', { script: scriptModelLabel, image: modelLabel, style: t(`style.${settings.style}`) })}
          </div>
        </div>
      )}

      {/* Empty State / Onboarding */}
      {panels.length === 0 && !errorMsg && state === 'idle' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full opacity-60">
          <div className="bg-white p-6 rounded-xl border-2 border-slate-200 text-center">
            <div className="w-12 h-12 bg-comic-yellow rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
              1
            </div>
            <h3 className="font-bold mb-2">{t('onboarding.step1.title')}</h3>
            <p className="text-sm">{t('onboarding.step1.text')}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-slate-200 text-center">
            <div className="w-12 h-12 bg-comic-blue rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black text-white">
              2
            </div>
            <h3 className="font-bold mb-2">{t('onboarding.step2.title')}</h3>
            <p className="text-sm">{t('onboarding.step2.text')}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border-2 border-slate-200 text-center">
            <div className="w-12 h-12 bg-comic-purple rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black text-white">
              3
            </div>
            <h3 className="font-bold mb-2">{t('onboarding.step3.title')}</h3>
            <p className="text-sm">{t('onboarding.step3.text')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
