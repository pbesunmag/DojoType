import { Pokemon, GenerationKey, GenerationConfig } from '../types';

const API_BASE = 'https://pokeapi.co/api/v2';

// Colores oficiales hexadecimales de cada tipo en los juegos
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export const GENERATIONS: Record<GenerationKey, GenerationConfig> = {
  gen1: { name: 'Gen 1 (Kanto original: 1-151)', maxId: 151, hasFairy: false },
  gen3: { name: 'Gen 3 (Rojo Fuego / Kanto GBA: 1-151)', maxId: 151, hasFairy: false },
  all:  { name: 'Nacional (Todas las Gen: 1-898)', maxId: 898, hasFairy: true },
};

// En Gen 1 original solo existían 15 tipos (sin Dark, Steel ni Fairy)
const GEN1_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel'
];

// En Gen 3 se añadieron Dark y Steel, pero aún no Fairy
const GEN3_TYPES = [...GEN1_TYPES];

export const getAvailableTypes = (gen: GenerationKey) => {
  if (gen === 'gen1') return GEN1_TYPES;
  if (gen === 'gen3') return GEN3_TYPES;
  return [...GEN3_TYPES, 'fairy'];
};

// Atacantes representativos estrictamente de Kanto (IDs 1-151)
const KANTO_ATTACKERS: Record<string, number> = {
  normal: 143,   // Snorlax
  fire: 6,       // Charizard
  water: 9,      // Blastoise
  electric: 25,  // Pikachu
  grass: 3,      // Venusaur
  ice: 131,      // Lapras
  fighting: 68,  // Machamp
  poison: 94,    // Gengar
  ground: 105,   // Marowak
  flying: 18,    // Pidgeot
  psychic: 150,  // Mewtwo
  bug: 123,      // Scyther
  rock: 76,      // Golem
  ghost: 93,     // Haunter
  dragon: 149,   // Dragonite
  dark: 53,      // Persian (adaptado en Kanto con mordisco)
  steel: 82,     // Magneton (eléctrico/acero retroactivo)
  fairy: 35,     // Clefairy
};

const TYPE_CHART: Record<string, { double: string[], half: string[], zero: string[] }> = {
  normal:   { double: [], half: ['rock', 'steel'], zero: ['ghost'] },
  fire:     { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'grass', 'dragon'], zero: [] },
  water:    { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'], zero: [] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], zero: ['ground'] },
  grass:    { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], zero: [] },
  ice:      { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'], zero: [] },
  fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug', 'fairy'], zero: ['ghost'] },
  poison:   { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], zero: ['steel'] },
  ground:   { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], zero: ['flying'] },
  flying:   { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'], zero: [] },
  psychic:  { double: ['fighting', 'poison'], half: ['psychic', 'steel'], zero: ['dark'] },
  bug:      { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], zero: [] },
  rock:     { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'], zero: [] },
  ghost:    { double: ['psychic', 'ghost'], half: ['dark'], zero: ['normal'] },
  dragon:   { double: ['dragon'], half: ['steel'], zero: ['fairy'] },
  dark:     { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'], zero: [] },
  steel:    { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'], zero: [] },
  fairy:    { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'], zero: [] }
};

export const getRandomPokemonId = (max = 151) => Math.floor(Math.random() * max) + 1;

export const fetchPokemon = async (id: number): Promise<Pokemon> => {
  const res = await fetch(`${API_BASE}/pokemon/${id}`);
  const data = await res.json();

  const spriteFront = 
    data.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default ||
    data.sprites?.other?.showdown?.front_default ||
    data.sprites?.front_default ||
    '';

  const spriteBack = 
    data.sprites?.versions?.['generation-v']?.['black-white']?.animated?.back_default ||
    data.sprites?.other?.showdown?.back_default ||
    data.sprites?.back_default ||
    spriteFront;

  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t: any) => t.type.name),
    spriteFront,
    spriteBack,
  };
};

export const fetchAttackerForType = async (type: string): Promise<Pokemon> => {
  const id = KANTO_ATTACKERS[type] || 25;
  return fetchPokemon(id);
};

export const checkEffectiveness = (attackType: string, defenderTypes: string[]): number => {
  let multiplier = 1;
  const attackRelations = TYPE_CHART[attackType];
  if (!attackRelations) return 1;

  for (const defType of defenderTypes) {
    if (attackRelations.double.includes(defType)) multiplier *= 2;
    else if (attackRelations.half.includes(defType)) multiplier *= 0.5;
    else if (attackRelations.zero.includes(defType)) multiplier *= 0;
  }
  return multiplier;
};

export const getRandomOptions = (pool: string[], guaranteedType?: string) => {
  const available = pool.filter(t => t !== guaranteedType);
  const shuffled = available.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, guaranteedType ? 3 : 4);

  if (guaranteedType) {
    selected.push(guaranteedType);
  }

  return selected.sort(() => 0.5 - Math.random());
};