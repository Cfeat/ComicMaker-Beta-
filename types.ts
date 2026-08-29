// Single source of truth for selectable image models. `size` is forwarded to
// the image API so panels come back square; omit it for models that pick
// their own resolution (e.g. the 4K variant).
export const IMAGE_MODELS = [
  { value: 'gpt-image-2', label: 'GPT Image 2', size: '1024x1024' },
  { value: 'gpt-image-2-4K', label: 'GPT Image 2 4K', size: undefined },
] as const;

export type ImageModel = (typeof IMAGE_MODELS)[number]['value'];

// Art-style presets appended to every visual prompt.
export const STYLE_PRESETS = {
  comic: {
    label: 'Comic Book',
    suffix: 'vibrant comic book style, thick black ink outlines, cel shaded, bold saturated colors, high quality',
  },
  manga: {
    label: 'Manga',
    suffix: 'black and white manga style, clean linework, screentone shading, dramatic perspective, high quality',
  },
  noir: {
    label: 'Noir',
    suffix: 'high-contrast black and white noir comic style, dramatic shadows, ink wash, moody atmosphere',
  },
  watercolor: {
    label: 'Watercolor',
    suffix: 'soft watercolor illustration style, gentle pastel palette, paper texture, loose brushwork',
  },
  cartoon: {
    label: 'Cartoon',
    suffix: 'modern flat cartoon style, simple bold shapes, bright playful colors, clean vector look',
  },
} as const;

export type ComicStyle = keyof typeof STYLE_PRESETS;

export interface ComicPanelData {
  panel_number: number;
  description: string;
  visual_prompt: string;
  dialogue?: string;
  character?: string;
  caption?: string;
}

export interface ComicScript {
  title: string;
  panels: ComicPanelData[];
}

// `id` is generated client-side (crypto.randomUUID) because the model does not
// guarantee unique panel_numbers, and it doubles as a stable React key.
export interface GeneratedPanel extends ComicPanelData {
  id: string;
  imageData?: string; // data URL (preferred) or remote URL
  isLoading: boolean;
  error?: string;
}

export type GeneratorState =
  | 'idle'
  | 'generating_script'
  | 'reviewing_script'
  | 'generating_images'
  | 'complete'
  | 'error';
