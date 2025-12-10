import React from 'react';
import { GeneratedPanel } from '../types';
import { RefreshCcw, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ComicPanelProps {
  panel: GeneratedPanel;
  onRegenerate: (panelNumber: number) => void;
}

export const ComicPanel: React.FC<ComicPanelProps> = ({ panel, onRegenerate }) => {
  return (
    <div className="relative group flex flex-col w-full aspect-square border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Image Area */}
      <div className="flex-1 relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
        {panel.isLoading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 animate-pulse">
            <ImageIcon size={48} className="mb-2 opacity-50" />
            <p className="font-comic font-bold text-lg">Drawing...</p>
          </div>
        ) : panel.error ? (
           <div className="flex flex-col items-center justify-center text-red-500 p-4 text-center">
            <AlertCircle size={32} className="mb-2" />
            <p className="text-sm font-bold">{panel.error}</p>
            <button 
              onClick={() => onRegenerate(panel.panel_number)}
              className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
            >
              Retry
            </button>
          </div>
        ) : panel.imageData ? (
          <img 
            src={panel.imageData} 
            alt={`Panel ${panel.panel_number}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-slate-300">Waiting for script...</div>
        )}

        {/* Regenerate Button (Visible on Hover) */}
        {!panel.isLoading && panel.imageData && (
          <button
            onClick={() => onRegenerate(panel.panel_number)}
            className="absolute top-2 right-2 p-2 bg-white/90 border-2 border-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-comic-yellow hover:scale-110 z-20"
            title="Redraw this panel"
          >
            <RefreshCcw size={16} />
          </button>
        )}
      </div>

      {/* Caption Box (Top Left) */}
      {panel.caption && !panel.isLoading && panel.imageData && (
        <div className="absolute top-0 left-0 max-w-[80%] bg-comic-yellow border-r-2 border-b-2 border-black px-3 py-1 z-10 shadow-sm">
          <p className="font-bangers tracking-wide text-sm uppercase text-black leading-tight">
            {panel.caption}
          </p>
        </div>
      )}

      {/* Dialogue Bubble (Bottom) */}
      {panel.dialogue && !panel.isLoading && panel.imageData && (
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          <div className="bg-white border-2 border-black rounded-[2rem] rounded-bl-none p-3 shadow-md inline-block max-w-full relative pointer-events-auto">
            {/* Simple Bubble Tail */}
            <div className="absolute -bottom-[10px] left-[10px] w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-black border-r-[0px] border-r-transparent"></div>
            <div className="absolute -bottom-[6px] left-[12px] w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-white border-r-[0px] border-r-transparent"></div>
            
            <p className="font-comic font-bold text-sm md:text-base leading-snug text-black">
              {panel.character && <span className="text-comic-purple uppercase text-xs block mb-0.5">{panel.character}</span>}
              {panel.dialogue}
            </p>
          </div>
        </div>
      )}
      
      {/* Panel Number Badge */}
      <div className="absolute bottom-0 right-0 bg-black text-white px-2 py-0.5 font-bangers text-xs z-10">
        #{panel.panel_number}
      </div>
    </div>
  );
};