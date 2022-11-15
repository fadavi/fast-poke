import { FastifyRequest, FastifyReply } from "fastify";
// import { PokemonWithStats } from "models/PokemonWithStats";

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
  const response: any = await pokeApi(`/api/v2/pokemon/${name}`);

  if (response == null) {
    return reply.callNotFound();
  }

  // TEMP: for now, do not compute! :)
  // computeResponse(response);

  reply.send(response);
}

export async function computeResponse(pokemon: any) {
  const typeRequests = pokemon.types.map((t) => pokeApi(t.type.url));
  const types = await Promise.all(typeRequests);

  if (types == undefined) throw types;

  for (const pokemonStat of pokemon.stats) {
    const stats = [];

    for (const type of types) {
      for (const typeStat of type.stats) {
        if (typeStat.stat.name.toUpperCase() == pokemonStat.stat.name) {
          stats.push(typeStat.base_stat);
        }
      }
    }

    if (stats.length) {
      const avg = stats.reduce((a, b) => a + b) / stats.length;
      pokemonStat.averageStat = avg;
    } else {
      pokemonStat.averageStat = 0;
    }
  }
}
