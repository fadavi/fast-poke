import { FastifyRequest, FastifyReply } from "fastify";
// import { PokemonWithStats } from "models/PokemonWithStats";

function equalsIgnoreCase(a: string, b: string) {
  if (a == b) {
    return true;
  } else if (!a || !b) {
    return !a === !b;
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

export async function getPokemonByName(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // TODO: validate/sanitize param(s)
  const name: string = request.params["name"];

  // let's suppose the `name` param is valid
  const pokemon: any = await pokeApi(`/api/v2/pokemon/${name}`);

  if (pokemon == null) {
    return reply.callNotFound();
  }

  // mutates `pokemon`:
  await computeStatsAverage(pokemon);

  reply.send(pokemon);
}

export async function computeStatsAverage(pokemon: any) {
  const typeRequests = pokemon.types.map((t) => pokeApi(t.type.url));
  // TODO: handle nil (404) responses
  const types = await Promise.all(typeRequests);

  // use `reduce` since `flatMap` is not accessible according to the tsconfig
  const allStats = types.reduce<any[]>((allStats, type: any) => {
    /* HEADS UP: "Type" model hasn't got `stats` property:
     * https://pokeapi.co/docs/v2#types */
    allStats.push(...(type.stats ?? []));
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
}
