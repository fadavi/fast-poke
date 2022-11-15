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

async function computeStatsAverage(_pokemon: Pokemon) {
  const pokemon = _pokemon as PokemonWithStatAverage;

  const typeRequests: Promise<Type | null>[] = pokemon.types
    .map((t) => t.type.url)
    .map((url) => pokeApi(url));
  const types = (await Promise.all(typeRequests)).filter(Boolean);

  // use `reduce` since `flatMap` is not accessible according to the tsconfig
  const allStats = types.reduce<PokemonStat[]>((allStats, type) => {
    /* HEADS UP: "Type" model hasn't got `stats` property:
     * https://pokeapi.co/docs/v2#types */
    allStats.push(...((type as any).stats ?? []));
    return allStats;
  }, []);

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
  // TODO: validate/sanitize param(s)
  const name: string = request.params["name"];

  // let's suppose the `name` param is valid
  const pokemon: Pokemon | null = await pokeApi(`/api/v2/pokemon/${name}`);

  if (pokemon === null) {
    return reply.callNotFound();
  }

  // mutates `pokemon`:
  const pokemonWithStatAverage = await computeStatsAverage(pokemon);
  reply.send(pokemonWithStatAverage);
}
