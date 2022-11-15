import { FastifyRequest, FastifyReply } from "fastify";
import { Pokemon, PokemonStat, PokemonWithStatAverage } from "./models/Pokemon";
import { Type } from "./models/Type";

function equalsIgnoreCase(a: string, b: string) {
  if (a == b) {
    return true;
  } else if (a == null || b == null) {
    return a == b;
  }
  return String(a).toUpperCase() === String(b).toUpperCase();
}

async function pokeApi(
  absolutePath: string,
  options: Record<string, any> = {}
) {
  // XXX: why not fetch API?!
  // TODO: use https agent
  // TODO: ... or improve error handling

  const url = new URL(absolutePath, "https://pokeapi.co");
  url.search = String(new URLSearchParams(options));

  const res = await fetch(String(url), {
    headers: { Accept: "application/json" },
  });

  // TODO: improve error handling
  if (res.status !== 200) {
    return null;
  }

  return res.json();
}

/**
 * Calculates average of base stat for each stat of the `pokemon`.
 * But, according to PokeApi docs, `Type` model hasn't got a `stat` property.
 * So, I decided to change the spec. These PokeApi models are somehow related to
 * `stats` or `stat`:
 * 1. Evolution Chain
 * 2. Move
 * 3. Characteristic[?]
 * 4. Nature
 * 5. Pokeathlon Stat
 * 6. Pokemon
 * Beside that, among the models, the `base_stat` only exists in `Pokemon`. It's
 * my bet that the best option is to calculate the average stat among all
 * pokemons having a particular stat.
 */
async function computeStatsAverage(_pokemon: Pokemon) {
  const pokemon = _pokemon as PokemonWithStatAverage;

  const typeRequests: Promise<Type | null>[] = pokemon.types
    .map((t) => t.type.url)
    .map((url) => pokeApi(url));
  const types = (await Promise.all(typeRequests)).filter(Boolean);

  const allStats = types.flatMap<PokemonStat>(
    /* HEADS UP: "Type" model hasn't got `stats` property:
     * https://pokeapi.co/docs/v2#types
     * Because of this, the result is always ZERO! */
    (type) => (type as Pokemon).stats ?? []
  );

  for (const pokemonStat of pokemon.stats) {
    pokemonStat.averageStat = 0;

    const stats = [];

    for (const typeStat of allStats) {
      if (equalsIgnoreCase(typeStat.stat.name, pokemonStat.stat.name)) {
        stats.push(typeStat.base_stat);
      }
    }

    if (stats.length) {
      const avg = stats.reduce((a, b) => a + b) / stats.length;
      pokemonStat.averageStat = avg;
    }
  }

  return pokemon;
}

export async function getPokemonByName(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const name: string = request.params["name"];
  const pokemon: Pokemon | null = await pokeApi(`/api/v2/pokemon/${name}`);

  if (pokemon === null) {
    return reply.callNotFound();
  }

  // mutates `pokemon`:
  const pokemonWithStatAverage = await computeStatsAverage(pokemon);
  reply.send(pokemonWithStatAverage);
}
