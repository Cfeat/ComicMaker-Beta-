import React from 'react';
import { Eraser, PenLine, Wand2 } from 'lucide-react';
import { ComicPanelData, GeneratedPanel } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface ScriptEditorProps {
  title: string;
  panels: GeneratedPanel[];
  onTitleChange: (value: string) => void;
  onPanelChange: (panelId: string, patch: Partial<ComicPanelData>) => void;
  onDraw: () => void;
  onDiscard: () => void;
}

const fieldClass =
  'w-full rounded-lg border-2 border-slate-200 focus:border-black bg-white px-2 py-1 text-sm font-comic focus:outline-none mt-1';

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  title,
  panels,
  onTitleChange,
  onPanelChange,
  onDraw,
  onDiscard,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-5xl mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4 px-2">
        <label className="flex min-w-0 w-full sm:w-auto items-baseline gap-3 grow">
          <span className="text-xs font-bold uppercase text-slate-400 shrink-0">{t('editor.title')}</span>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="min-w-0 w-full font-bangers text-2xl sm:text-3xl text-slate-800 bg-transparent border-b-2 border-dashed border-slate-300 focus:border-comic-purple focus:outline-none grow"
            aria-label={t('editor.title')}
            placeholder={t('editor.untitled')}
          />
        </label>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onDiscard}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border-2 border-black px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all font-bold text-sm"
          >
            <Eraser size={15} /> {t('button.startOver')}
          </button>
          <button
            type="button"
            onClick={onDraw}
            className="flex items-center gap-2 bg-comic-purple hover:bg-purple-500 text-white border-2 border-black px-4 py-1.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all font-bangers tracking-wider text-lg"
          >
            <Wand2 size={18} /> {t('button.draw')}
          </button>
        </div>
      </div>

      <p className="text-center text-slate-500 text-sm mb-4 flex items-center justify-center gap-1.5">
        <PenLine size={14} /> {t('editor.hint')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {panels.map((panel) => (
          <div key={panel.id} className="bg-white border-2 border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bangers text-lg text-slate-400">{t('editor.panel', { n: panel.panel_number })}</span>
            </div>
            {panel.description && <p className="text-xs text-slate-400 italic leading-snug">{panel.description}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block text-xs font-bold uppercase text-slate-500">
                {t('editor.caption')}
                <input
                  value={panel.caption ?? ''}
                  onChange={(e) => onPanelChange(panel.id, { caption: e.target.value || undefined })}
                  className={fieldClass}
                  placeholder={t('editor.captionPlaceholder')}
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                {t('editor.speaker')}
                <input
                  value={panel.character ?? ''}
                  onChange={(e) => onPanelChange(panel.id, { character: e.target.value || undefined })}
                  className={fieldClass}
                  placeholder={t('editor.speakerPlaceholder')}
                />
              </label>
            </div>
            <label className="block text-xs font-bold uppercase text-slate-500">
              {t('editor.dialogue')}
              <input
                value={panel.dialogue ?? ''}
                onChange={(e) => onPanelChange(panel.id, { dialogue: e.target.value || undefined })}
                className={fieldClass}
                placeholder={t('editor.dialoguePlaceholder')}
              />
            </label>
            <label className="block text-xs font-bold uppercase text-slate-500">
              {t('editor.visualPrompt')}
              <textarea
                value={panel.visual_prompt}
                onChange={(e) => onPanelChange(panel.id, { visual_prompt: e.target.value })}
                className={fieldClass}
                rows={3}
                placeholder={t('editor.visualPromptPlaceholder')}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
