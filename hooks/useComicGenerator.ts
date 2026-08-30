import { useCallback, useEffect, useRef, useState } from 'react';
import {
  classifyApiError,
  fetchComicScript,
  fetchServerConfig,
  generatePanelImage,
  type ApiErrorKind,
} from '../services/api';
import { abortableDelay, withRetry } from '../services/retry';
import { useTranslation } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import {
  ComicPanelData,
  ComicScript,
  ComicStyle,
  GeneratedPanel,
  GeneratorState,
  IMAGE_MODELS,
  ImageModel,
  SCRIPT_MODELS,
  ScriptModel,
  ServerConfig,
} from '../types';

// Pacing between panel requests: much cheaper than the old fixed 5s sleep,
// rate limits are handled reactively by withRetry instead.
const PANEL_REQUEST_DELAY_MS = 1000;
const IMAGE_RETRIES = 2;
const IMAGE_RETRY_BASE_DELAY_MS = 3000;
const SCRIPT_RETRIES = 1;
const SCRIPT_RETRY_BASE_DELAY_MS = 5000;

export interface GeneratorSettings {
  model: ImageModel;
  style: ComicStyle;
  scriptModel: ScriptModel;
}

export const DEFAULT_SETTINGS: GeneratorSettings = {
  model: IMAGE_MODELS[0].value,
  style: 'comic',
  scriptModel: SCRIPT_MODELS[0].value,
};

function toGeneratedPanels(script: ComicScript): GeneratedPanel[] {
  return script.panels.map((panel) => ({ ...panel, id: crypto.randomUUID(), isLoading: false }));
}

const ERROR_CONTEXT_KEYS: Partial<Record<ApiErrorKind, TranslationKey>> = {
  network: 'error.context.network',
  auth: 'error.context.auth',
  notFound: 'error.context.notFound',
  rateLimit: 'error.context.rateLimit',
};

function buildFileName(title: string): string {
  const safe = title
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `comic-${safe || 'strip'}`.toLowerCase();
}

export const useComicGenerator = () => {
  const { t } = useTranslation();

  const [state, setState] = useState<GeneratorState>('idle');
  const [title, setTitle] = useState('');
  const [panels, setPanels] = useState<GeneratedPanel[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState<GeneratorSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<ServerConfig | null>(null);

  // Mirror of `panels` that callbacks can read without going stale.
  const panelsRef = useRef<GeneratedPanel[]>([]);
  panelsRef.current = panels;
  const abortRef = useRef<AbortController | null>(null);

  // Which script providers have keys configured (from GET /api/config), so the
  // UI can default to a model that actually works. Null = unknown.
  useEffect(() => {
    let cancelled = false;
    fetchServerConfig()
      .then((value) => {
        if (!cancelled) setConfig(value);
      })
      .catch(() => {
        // Config unavailable (e.g. static deploy without functions): the UI
        // falls back to showing every option.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const abortActiveRequest = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const describeError = useCallback(
    (error: unknown, fallbackKey: TranslationKey): string => {
      const { kind, status, detail } = classifyApiError(error);
      const fallback = t(fallbackKey);
      const contextKey = ERROR_CONTEXT_KEYS[kind];
      if (contextKey) return `${fallback} ${t(contextKey, { status })}`;
      return detail ? `${fallback} ${detail}` : fallback;
    },
    [t],
  );

  const panelErrorMessage = useCallback(
    (error: unknown): string => {
      const { kind, detail } = classifyApiError(error);
      switch (kind) {
        case 'rateLimit':
          return t('panel.rateLimited');
        case 'auth':
          return t('panel.authRejected');
        case 'network':
          return t('panel.network');
        default:
          return detail ?? t('panel.failed');
      }
    },
    [t],
  );

  const resetAll = useCallback(() => {
    abortActiveRequest();
    setPanels([]);
    setTitle('');
    setErrorMsg(null);
    setState('idle');
  }, [abortActiveRequest]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const updateSettings = useCallback((next: GeneratorSettings) => {
    setSettings(next);
  }, []);

  const updateTitle = useCallback((value: string) => {
    setTitle(value);
  }, []);

  const updatePanel = useCallback((panelId: string, patch: Partial<ComicPanelData>) => {
    setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, ...patch } : p)));
  }, []);

  const startGeneration = useCallback(
    async (prompt: string, nextSettings: GeneratorSettings) => {
      abortActiveRequest();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setSettings(nextSettings);
      setErrorMsg(null);
      setPanels([]);
      setTitle('');
      setState('generating_script');

      try {
        const script = await withRetry(() => fetchComicScript(prompt, nextSettings.scriptModel, signal), {
          retries: SCRIPT_RETRIES,
          baseDelayMs: SCRIPT_RETRY_BASE_DELAY_MS,
          signal,
        });
        if (signal.aborted) {
          setState('idle');
          return;
        }
        setTitle(script.title);
        setPanels(toGeneratedPanels(script));
        setState('reviewing_script');
      } catch (error) {
        if (signal.aborted) {
          setState('idle');
          return;
        }
        console.error('Script generation failed:', error);
        setState('error');
        setErrorMsg(describeError(error, 'error.scriptFailed'));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [abortActiveRequest, describeError],
  );

  const drawPanels = useCallback(async () => {
    const currentPanels = panelsRef.current;
    if (currentPanels.length === 0) return;

    abortActiveRequest();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setErrorMsg(null);
    setState('generating_images');
    setPanels((prev) => prev.map((p) => ({ ...p, isLoading: true, error: undefined, imageData: undefined })));

    let generatedCount = 0;
    const failedPanels: GeneratedPanel[] = [];

    for (let index = 0; index < currentPanels.length; index++) {
      const panel = currentPanels[index];
      if (signal.aborted) break;
      try {
        const imageData = await withRetry(
          () => generatePanelImage(panel.visual_prompt, settings.model, settings.style, signal),
          { retries: IMAGE_RETRIES, baseDelayMs: IMAGE_RETRY_BASE_DELAY_MS, signal },
        );
        if (signal.aborted) break;
        generatedCount += 1;
        setPanels((prev) => prev.map((p) => (p.id === panel.id ? { ...p, imageData, isLoading: false } : p)));
      } catch (error) {
        if (signal.aborted) break;
        console.error(`Failed to generate panel ${panel.panel_number}:`, error);
        failedPanels.push(panel);
        setPanels((prev) =>
          prev.map((p) => (p.id === panel.id ? { ...p, isLoading: false, error: panelErrorMessage(error) } : p)),
        );
      }
      // Skip the trailing delay after the last panel.
      if (index < currentPanels.length - 1) {
        await abortableDelay(PANEL_REQUEST_DELAY_MS, signal);
      }
    }

    // Give failed panels a second pass after the rest of the strip has had a
    // chance to finish. This prevents one transient failure from leaving a
    // permanent hole while still keeping the workflow bounded.
    for (const panel of failedPanels) {
      if (signal.aborted) break;
      setPanels((prev) => prev.map((p) => (p.id === panel.id ? { ...p, isLoading: true, error: undefined } : p)));
      try {
        const imageData = await withRetry(
          () => generatePanelImage(panel.visual_prompt, settings.model, settings.style, signal),
          { retries: IMAGE_RETRIES, baseDelayMs: IMAGE_RETRY_BASE_DELAY_MS, signal },
        );
        if (signal.aborted) break;
        generatedCount += 1;
        setPanels((prev) => prev.map((p) => (p.id === panel.id ? { ...p, imageData, isLoading: false, error: undefined } : p)));
      } catch (error) {
        if (signal.aborted) break;
        console.error(`Failed to retry panel ${panel.panel_number}:`, error);
        setPanels((prev) =>
          prev.map((p) => (p.id === panel.id ? { ...p, isLoading: false, error: panelErrorMessage(error) } : p)),
        );
      }
    }

    if (signal.aborted) {
      setPanels((prev) => prev.map((p) => (p.isLoading ? { ...p, isLoading: false, error: t('panel.cancelled') } : p)));
      setState(generatedCount > 0 ? 'complete' : 'reviewing_script');
    } else {
      setState('complete');
    }
    if (abortRef.current === controller) abortRef.current = null;
  }, [abortActiveRequest, settings, panelErrorMessage, t]);

  const regeneratePanel = useCallback(
    async (panelId: string) => {
      const panel = panelsRef.current.find((p) => p.id === panelId);
      if (!panel || panel.isLoading) return;

      abortActiveRequest();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, isLoading: true, error: undefined } : p)));

      try {
        const imageData = await withRetry(
          () => generatePanelImage(panel.visual_prompt, settings.model, settings.style, signal),
          { retries: IMAGE_RETRIES, baseDelayMs: IMAGE_RETRY_BASE_DELAY_MS, signal },
        );
        setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, imageData, isLoading: false } : p)));
      } catch (error) {
        if (signal.aborted) {
          setPanels((prev) => prev.map((p) => (p.id === panelId ? { ...p, isLoading: false, error: t('panel.cancelled') } : p)));
          return;
        }
        console.error(`Failed to regenerate panel ${panel.panel_number}:`, error);
        setPanels((prev) =>
          prev.map((p) => (p.id === panelId ? { ...p, isLoading: false, error: panelErrorMessage(error) } : p)),
        );
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [abortActiveRequest, settings, panelErrorMessage, t],
  );

  const downloadComic = useCallback(async () => {
    const element = document.getElementById('comic-strip-container');
    if (!element || isSaving) return;
    setIsSaving(true);
    try {
      // Loaded on demand so this large dependency stays out of the initial bundle.
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#f8fafc',
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not encode the comic image.');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${buildFileName(title)}.png`;
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error('Download failed:', error);
      setErrorMsg(t('error.downloadFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, title, t]);

  return {
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
  };
};
