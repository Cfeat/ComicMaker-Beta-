import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  ComicStyle,
  GeneratorState,
  IMAGE_MODELS,
  ImageModel,
  SCRIPT_MODELS,
  ScriptModel,
  ScriptProvider,
  ServerConfig,
  STYLE_PRESETS,
} from '../types';
import { DEFAULT_SETTINGS, type GeneratorSettings } from '../hooks/useComicGenerator';
import { useTranslation } from '../i18n/LanguageContext';

interface InputFormProps {
  onSubmit: (prompt: string, settings: GeneratorSettings) => void;
  onSettingsChange: (settings: GeneratorSettings) => void;
  state: GeneratorState;
  onCancel: () => void;
  config: ServerConfig | null;
}

const STATUS_CLASS: Record<GeneratorState, string> = {
  idle: '',
  generating_script: 'text-comic-purple',
  reviewing_script: 'text-slate-500',
  generating_images: 'text-comic-blue',
  complete: '',
  error: 'text-red-500',
};

const selectClass =
  'rounded-lg border-2 border-black bg-white px-3 py-1.5 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60';

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, onSettingsChange, state, onCancel, config }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ImageModel>(DEFAULT_SETTINGS.model);
  const [style, setStyle] = useState<ComicStyle>(DEFAULT_SETTINGS.style);
  const [scriptModel, setScriptModel] = useState<ScriptModel>(DEFAULT_SETTINGS.scriptModel);

  const isGenerating = state === 'generating_script' || state === 'generating_images';

  // While the server config is unknown every option is offered; once it
  // loads, models whose provider key is missing are disabled and the
  // selection jumps to the first model that can actually run.
  const isProviderAvailable = (provider: ScriptProvider) => config === null || Boolean(config.providers[provider]);

  useEffect(() => {
    if (!config) return;
    const current = SCRIPT_MODELS.find((entry) => entry.value === scriptModel);
    if (current && config.providers[current.provider]) return;
    const firstAvailable = SCRIPT_MODELS.find((entry) => config.providers[entry.provider]);
    if (firstAvailable && firstAvailable.value !== scriptModel) {
      setScriptModel(firstAvailable.value);
      onSettingsChange({ model, style, scriptModel: firstAvailable.value });
    }
  }, [config, scriptModel, model, style, onSettingsChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onSubmit(prompt.trim(), { model, style, scriptModel });
    }
  };

  const updateStyle = (nextStyle: ComicStyle) => {
    setStyle(nextStyle);
    onSettingsChange({ model, style: nextStyle, scriptModel });
  };

  const updateModel = (nextModel: ImageModel) => {
    setModel(nextModel);
    onSettingsChange({ model: nextModel, style, scriptModel });
  };

  const updateScriptModel = (nextScriptModel: ScriptModel) => {
    setScriptModel(nextScriptModel);
    onSettingsChange({ model, style, scriptModel: nextScriptModel });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20">
      <form onSubmit={handleSubmit} className="relative space-y-3">
          <div className="relative flex flex-col gap-2 sm:block">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder={t('form.placeholder')}
            className="w-full p-3 sm:p-4 sm:pr-32 text-base sm:text-lg rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all resize-none h-24 font-comic"
          />
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`relative w-full sm:absolute sm:right-3 sm:top-3 sm:bottom-3 sm:w-auto rounded-lg px-6 py-2 sm:py-0 flex items-center justify-center font-bangers tracking-wider text-xl transition-all border-2 border-black
              ${
                isGenerating
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-comic-blue text-white hover:bg-teal-400 hover:-translate-y-1 hover:shadow-md'
              }`}
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : (
              <>
                {t('form.create')} <Sparkles size={18} className="ml-2" />
              </>
            )}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 font-sans text-sm font-bold text-slate-600">
          <label className="flex min-w-0 max-w-full items-center gap-2">
            {t('form.scriptModel')}
            <select
              value={scriptModel}
              onChange={(event) => updateScriptModel(event.target.value as ScriptModel)}
              disabled={isGenerating}
              className={`${selectClass} min-w-0 max-w-full`}
            >
              {SCRIPT_MODELS.map((entry) => {
                const available = isProviderAvailable(entry.provider);
                return (
                  <option key={entry.value} value={entry.value} disabled={!available}>
                    {entry.label}
                    {available ? '' : ` ${t('form.keyNotSet')}`}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="flex min-w-0 max-w-full items-center gap-2">
            {t('form.artStyle')}
            <select
              value={style}
              onChange={(event) => updateStyle(event.target.value as ComicStyle)}
              disabled={isGenerating}
              className={`${selectClass} min-w-0 max-w-full`}
            >
              {(Object.keys(STYLE_PRESETS) as ComicStyle[]).map((value) => (
                <option key={value} value={value}>
                  {t(`style.${value}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 max-w-full items-center gap-2">
            {t('form.imageModel')}
            <select
              value={model}
              onChange={(event) => updateModel(event.target.value as ImageModel)}
              disabled={isGenerating}
              className={`${selectClass} min-w-0 max-w-full`}
            >
              {IMAGE_MODELS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      {/* Status Message */}
      <div className="min-h-8 mt-2 flex items-center justify-center gap-3" aria-live="polite">
        {(state === 'generating_script' || state === 'generating_images' || state === 'reviewing_script' || state === 'error') && (
          <span
            className={`font-bold ${STATUS_CLASS[state]} ${
              state === 'generating_script' || state === 'generating_images' ? 'animate-pulse' : ''
            }`}
          >
            {state === 'generating_script' && t('status.writingScript')}
            {state === 'generating_images' && t('status.inkingPanels')}
            {state === 'reviewing_script' && t('status.reviewHint')}
            {state === 'error' && t('status.error')}
          </span>
        )}
        {isGenerating && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 border-2 border-black px-2 py-0.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            {t('button.cancel')}
          </button>
        )}
      </div>
    </div>
  );
};
