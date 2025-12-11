import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ComicPanel } from './components/ComicPanel';
import { generateComicScript, generatePanelImage } from './services/geminiService';
import { GeneratedPanel, GeneratorState } from './types';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [generatorState, setGeneratorState] = useState<GeneratorState>(GeneratorState.IDLE);
  const [panels, setPanels] = useState<GeneratedPanel[]>([]);
  const [comicTitle, setComicTitle] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateComic = async (prompt: string) => {
    setGeneratorState(GeneratorState.GENERATING_SCRIPT);
    setErrorMsg(null);
    setPanels([]); // Clear previous
    setComicTitle('');

    try {
      // 1. Generate Script
      const script = await generateComicScript(prompt);
      setComicTitle(script.title);
      
      // Initialize panels with script data and loading state
      const initialPanels: GeneratedPanel[] = script.panels.map(p => ({
        ...p,
        isLoading: true,
      }));
      setPanels(initialPanels);
      setGeneratorState(GeneratorState.GENERATING_IMAGES);

      // 2. Generate Images (Sequential to avoid Rate Limits)
      // We loop through panels one by one instead of Promise.all
      for (const panel of script.panels) {
        try {
          const base64Image = await generatePanelImage(panel.visual_prompt);
          
          setPanels(prev => prev.map(p => 
            p.panel_number === panel.panel_number 
              ? { ...p, imageData: base64Image, isLoading: false } 
              : p
          ));

          // Add a small delay between requests to be gentle on the API free tier
          await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (err) {
            console.error(`Failed to generate panel ${panel.panel_number}`, err);
            setPanels(prev => prev.map(p => 
                p.panel_number === panel.panel_number 
                  ? { ...p, isLoading: false, error: "Failed to generate image." } 
                  : p
              ));
        }
      }

      setGeneratorState(GeneratorState.COMPLETE);

    } catch (error) {
      console.error("Workflow failed", error);
      setGeneratorState(GeneratorState.ERROR);
      setErrorMsg("Failed to generate the comic. The AI might be busy or the prompt was blocked.");
    }
  };

  const handleRegeneratePanel = async (panelNumber: number) => {
    // Find the panel
    const panel = panels.find(p => p.panel_number === panelNumber);
    if (!panel) return;

    // Set loading
    setPanels(prev => prev.map(p => 
        p.panel_number === panelNumber ? { ...p, isLoading: true, error: undefined } : p
    ));

    try {
        const base64Image = await generatePanelImage(panel.visual_prompt);
        setPanels(prev => prev.map(p => 
            p.panel_number === panelNumber 
              ? { ...p, imageData: base64Image, isLoading: false } 
              : p
          ));
    } catch (err) {
        setPanels(prev => prev.map(p => 
            p.panel_number === panelNumber ? { ...p, isLoading: false, error: "Retry failed." } : p
        ));
    }
  };

  const handleDownload = async () => {
    const comicElement = document.getElementById('comic-strip-container');
    if (comicElement) {
      const canvas = await html2canvas(comicElement, {
        scale: 2, // higher quality
        backgroundColor: '#f8fafc', // slate-50
      });
      const link = document.createElement('a');
      link.download = `comic-${comicTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-comic selection:bg-comic-yellow">
      
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
        <p className="text-slate-600 mt-4 text-lg max-w-md mx-auto leading-relaxed">
          Describe a story, and watch it come to life in a 4-panel comic strip!
        </p>
      </header>

      {/* Input Form */}
      <InputForm onSubmit={handleGenerateComic} state={generatorState} />

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 max-w-2xl w-full" role="alert">
            <p className="font-bold">Error</p>
            <p>{errorMsg}</p>
        </div>
      )}

      {/* Comic Display */}
      {panels.length > 0 && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="flex justify-between items-end mb-4 px-2">
            <div>
                 {comicTitle && (
                    <h2 className="text-3xl font-bangers text-slate-800">{comicTitle}</h2>
                 )}
            </div>
            
            {generatorState === GeneratorState.COMPLETE && (
                <div className="flex gap-2">
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-white hover:bg-slate-100 border-2 border-black px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all font-bold text-sm"
                    >
                        <Download size={16} /> Save Image
                    </button>
                </div>
            )}
          </div>

          {/* The Comic Grid - ID used for download screenshot */}
          <div 
            id="comic-strip-container" 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-slate-50 p-4 md:p-8 border-dashed border-4 border-slate-300 rounded-3xl"
          >
            {panels.map((panel) => (
              <ComicPanel 
                key={panel.panel_number} 
                panel={panel} 
                onRegenerate={handleRegeneratePanel} 
              />
            ))}
          </div>
          
          <div className="mt-8 text-center text-slate-400 text-sm font-sans">
            Generated with Google Gemini models. AI can make mistakes.
          </div>
        </div>
      )}

      {/* Empty State / Onboarding */}
      {panels.length === 0 && !errorMsg && generatorState === GeneratorState.IDLE && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full opacity-60">
           <div className="bg-white p-6 rounded-xl border-2 border-slate-200 text-center">
              <div className="w-12 h-12 bg-comic-yellow rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">1</div>
              <h3 className="font-bold mb-2">Write an Idea</h3>
              <p className="text-sm">"A cat becomes mayor of a small town"</p>
           </div>
           <div className="bg-white p-6 rounded-xl border-2 border-slate-200 text-center">
              <div className="w-12 h-12 bg-comic-blue rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black text-white">2</div>
              <h3 className="font-bold mb-2">AI Scripts It</h3>
              <p className="text-sm">Gemini creates the panels and dialogue.</p>
           </div>
           <div className="bg-white p-6 rounded-xl border-2 border-slate-200 text-center">
              <div className="w-12 h-12 bg-comic-purple rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black text-white">3</div>
              <h3 className="font-bold mb-2">Read & Share</h3>
              <p className="text-sm">Get your custom 4-panel comic strip.</p>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;