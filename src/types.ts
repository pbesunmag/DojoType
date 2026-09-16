export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  spriteFront: string;
  spriteBack: string;
}

export type GenerationKey = 'gen1' | 'gen3' | 'all';

export interface GenerationConfig {
  name: string;
  maxId: number;
  hasFairy: boolean;
}