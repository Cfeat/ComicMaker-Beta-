// Single source of truth for selectable image models. `size` is forwarded to
// the image API so panels come back square; omit it for models that pick
// their own resolution (e.g. the 4K variant).
export const IMAGE_MODELS = [
  { value: 'gpt-image-2', label: 'GPT Image 2', size: '1024x1024' },
  { value: 'gpt-image-2-4K', label: 'GPT Image 2 4K', size: undefined },
] as const;

export type ImageModel = (typeof IMAGE_MODELS)[number]['value'];

// Script writers. GPT models run on the same OpenAI-compatible proxy as the
// image models (chat/completions), so they only need IMAGE_API_KEY.
export const SCRIPT_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'gemini' },
  { value: 'gpt-5.5', label: 'GPT-5.5', provider: 'openai' },
  { value: 'gpt-5.6-sol', label: 'GPT-5.6 Sol', provider: 'openai' },
  { value: 'gpt-5.6-terra', label: 'GPT-5.6 Terra', provider: 'openai' },
] as const;

export type ScriptModel = (typeof SCRIPT_MODELS)[number]['value'];
export type ScriptProvider = 'gemini' | 'openai';

// Told to the client by GET /api/config so the UI can disable script models
// whose key is missing and default to an available one. Booleans only — no
// secrets ever leave the server.
export interface ServerConfig {
  providers: { gemini: boolean; openai: boolean };
}

// Art-style presets appended to every visual prompt.
export const STYLE_PRESETS = {
  comic: {
    label: 'Comic Book',
    suffix:
      'distinctive American superhero comic style, dynamic foreshortening, dramatic low-angle composition, heavy variable-width black inks, bold contour lines, hard-edged cel shading, saturated primary colors, strong rim lighting, halftone print texture, energetic action-panel finish; do not use Japanese manga linework or watercolor rendering',
  },
  manga: {
    label: 'Manga',
    suffix:
      'distinctive Japanese manga style, expressive anime-inspired faces and eyes, clean precise ink linework, controlled speed lines, screentone shading, selective solid blacks, cinematic panel composition, emotionally readable gestures, mostly monochrome with restrained gray tones; do not use American superhero coloring, glossy 3D rendering, or watercolor painting',
  },
  noir: {
    label: 'Noir',
    suffix:
      'strict black-and-white noir comic style, pure monochrome only, no hue and no color, stark chiaroscuro lighting, large graphic black shadow shapes, hard venetian-blind shadows, gritty brush-and-ink texture, smoky urban atmosphere, stark cinematic composition; do not use colorful comic-book rendering or anime styling',
  },
  watercolor: {
    label: 'Watercolor',
    suffix:
      'traditional hand-painted watercolor storybook illustration, translucent layered washes, visible paper grain, soft bleeding edges, loose natural brushwork, gentle pastel palette, organic imperfect shapes, atmospheric light; do not use heavy comic inks, cel shading, or 3D rendering',
  },
  cartoon: {
    label: 'Cartoon',
    suffix:
      'distinctive modern editorial cartoon style, simple geometric shapes, clean uniform outlines, flat vector-like color blocks, playful exaggerated expressions, minimal detail, bright limited palette, crisp graphic silhouette; do not use realistic rendering, manga screentones, or painterly brushwork',
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
