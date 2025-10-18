
export type AppState = 'idle' | 'loading' | 'result' | 'error';

export interface ImageFile {
  url: string;
  name: string;
}
