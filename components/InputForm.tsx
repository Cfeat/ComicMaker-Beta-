import React, { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { GeneratorState } from '../types';

interface InputFormProps {
  onSubmit: (prompt: string) => void;
  state: GeneratorState;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, state }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  const isGenerating = state !== GeneratorState.IDLE && state !== GeneratorState.COMPLETE && state !== GeneratorState.ERROR;

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-stretch">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder="Describe your comic idea... e.g., 'A robot trying to eat spaghetti for the first time'"
            className="w-full p-4 pr-32 text-lg rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all resize-none h-24 font-comic"
          />
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`absolute right-3 top-3 bottom-3 rounded-lg px-6 flex items-center justify-center font-bangers tracking-wider text-xl transition-all border-2 border-black
              ${isGenerating 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-comic-blue text-white hover:bg-teal-400 hover:-translate-y-1 hover:shadow-md'
              }`}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                CREATE <Sparkles size={18} className="ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Status Message */}
      <div className="h-6 mt-2 text-center">
        {state === GeneratorState.GENERATING_SCRIPT && (
          <span className="text-comic-purple font-bold animate-pulse">Writing the script...</span>
        )}
        {state === GeneratorState.GENERATING_IMAGES && (
          <span className="text-comic-blue font-bold animate-pulse">Inking the panels...</span>
        )}
        {state === GeneratorState.ERROR && (
            <span className="text-red-500 font-bold">Oops! Something went wrong. Try again.</span>
        )}
      </div>
    </div>
  );
};