import { NamedAPIResource } from "./NamedAPIResource";

export interface PokemonStat {
  // https://pokeapi.co/docs/v2#pokemonstat
  stat: NamedAPIResource;
  effort: number;
  base_stat: number;
}

export interface PokemonType {
  // https://pokeapi.co/docs/v2#pokemontype
  slot: number;
  type: NamedAPIResource;
}

export interface Pokemon {
  // https://pokeapi.co/docs/v2#pokemon (Cherry-picked)
  stats: PokemonStat[];
  types: PokemonType[];
}

export interface PokemonStatWithAverage extends PokemonStat {
  averageStat?: number; // average_stat IMHO
}

export interface PokemonWithStatAverage extends Pokemon {
  stats: PokemonStatWithAverage[];
}
