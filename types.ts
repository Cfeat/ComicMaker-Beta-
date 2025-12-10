export interface ComicPanel {
  panel_number: number;
  description: string;
  visual_prompt: string;
  dialogue?: string;
  character?: string;
  caption?: string;
}

export interface ComicScript {
  title: string;
  panels: ComicPanel[];
}

export interface GeneratedPanel extends ComicPanel {
  imageData?: string; // base64 string
  isLoading: boolean;
  error?: string;
}

export enum GeneratorState {
  IDLE = 'IDLE',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}