import React from 'react';
import { GeneratedPanel } from '../types';
import { RefreshCcw, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface ComicPanelProps {
  panel: GeneratedPanel;
  onRegenerate: (panelId: string) => void;
  // Regenerate/Retry stay hidden while the whole strip is still drawing, so a
  // stray click can't fire a parallel request against the running workflow.
  canRegenerate: boolean;
}

const ComicPanelComponent: React.FC<ComicPanelProps> = ({ panel, onRegenerate, canRegenerate }) => {
  const { t } = useTranslation();
  const showRegenerateButton = canRegenerate && !panel.isLoading && Boolean(panel.imageData);

  return (
    <div className="relative group flex flex-col w-full aspect-square border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Keep UI text outside the artwork so it cannot cover generated details. */}
      {panel.caption && !panel.isLoading && panel.imageData && (
        <div className="shrink-0 max-h-[25%] overflow-y-auto bg-comic-yellow border-b-2 border-black px-3 py-1">
          <p className="font-bangers tracking-wide text-sm uppercase text-black leading-tight break-words">{panel.caption}</p>
        </div>
      )}

      {/* Image Area */}
      <div className="relative flex-1 min-h-0 w-full bg-slate-100 flex items-center justify-center overflow-hidden p-1">
        {panel.isLoading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 animate-pulse">
            <ImageIcon size={48} className="mb-2 opacity-50" />
            <p className="font-comic font-bold text-lg">{t('panel.drawing')}</p>
          </div>
        ) : panel.error ? (
          <div className="flex flex-col items-center justify-center text-red-500 p-4 text-center">
            <AlertCircle size={32} className="mb-2" />
            <p className="text-sm font-bold">{panel.error}</p>
            {canRegenerate && (
              <button
                onClick={() => onRegenerate(panel.id)}
                className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded font-bold"
              >
                {t('button.retry')}
              </button>
            )}
          </div>
        ) : panel.imageData ? (
          <img
            src={panel.imageData}
            alt={t('panel.alt', { n: panel.panel_number, description: panel.description })}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-slate-300 text-sm">{t('panel.noImage')}</div>
        )}

        {/* Regenerate Button (Visible on Hover) */}
        {showRegenerateButton && (
          <button
            onClick={() => onRegenerate(panel.id)}
            className="absolute top-2 right-2 p-2 bg-white/90 border-2 border-black rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-comic-yellow hover:scale-110 z-20"
            title={t('panel.redraw', { n: panel.panel_number })}
            aria-label={t('panel.redraw', { n: panel.panel_number })}
          >
            <RefreshCcw size={16} />
          </button>
        )}
      </div>

      {/* Dialogue area sits below the image instead of overlaying it. */}
      {panel.dialogue && !panel.isLoading && panel.imageData && (
        <div className="relative shrink-0 max-h-[35%] overflow-y-auto min-h-[4.5rem] border-t-2 border-black bg-white px-3 py-2 flex items-center">
          <div className="w-full rounded-2xl border-2 border-black px-3 py-2 shadow-sm">
            <p className="font-comic font-bold text-sm md:text-base leading-snug text-black break-words">
              {panel.character && <span className="text-comic-purple uppercase text-xs block mb-0.5">{panel.character}</span>}
              {panel.dialogue}
            </p>
          </div>
        </div>
      )}

      {/* Panel Number Badge */}
      <div className="absolute top-1 right-1 bg-black text-white px-2 py-0.5 font-bangers text-xs z-10">
        #{panel.panel_number}
      </div>
    </div>
  );
};

// The strip re-renders on every panel update while drawing; memoization keeps
// finished panels from re-rendering each time. (Language changes still
// propagate through context.)
export const ComicPanel = React.memo(ComicPanelComponent);
