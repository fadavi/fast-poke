import { FastifyRequest, FastifyReply } from "fastify";
// import { PokemonWithStats } from "models/PokemonWithStats";
import * as http from "http";

async function pokeApi(
  absolutePath: string,
  options: Record<string, any> = {},
) {
  // XXX: why not fetch API?!
  // TODO: use https agent
  // TODO: ... or improve error handling

  const url = new URL(absolutePath, "https://pokeapi.co");
  url.search = String(new URLSearchParams(options))

  const res = await fetch(String(url), {
    headers: { Accept: "application/json" },
  });

  // TODO: improve error handling
  if (res.status !== 200) {
    return null
  }

  return res.json()
}

export async function getPokemonByName(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // TODO: validate/sanitize param(s)
  const name: string = request.params["name"];

  // let's suppose the `name` param is valid
  const response: any = await pokeApi(`/api/v2/pokemon/${name}`)

  if (response == null) {
    return reply.callNotFound();
  }

  // TEMP: for now, do not compute! :)
  // computeResponse(response);

  reply.send(response);
}

export async function computeResponse(resp: any) {
  const typeUrls = resp.types.map(t => t.type.url)

  const pokemonTypes = [];

  for (const typeUrl of typeUrls) {
    pokemonTypes.push(await pokeApi(typeUrl))
  }

  if (pokemonTypes == undefined) throw pokemonTypes;

  resp.stats.forEach((element) => {
    const stats = [];

    pokemonTypes.map((pok) =>
      pok.stats.map((st) =>
        st.stat.name.toUpperCase() == element.stat.name
          ? stats.push(st.base_state)
          : []
      )
    );

    if (stats) {
      const avg = stats.reduce((a, b) => a + b) / stats.length;
      element.averageStat = avg;
    } else {
      element.averageStat = 0;
    }
  });
}
