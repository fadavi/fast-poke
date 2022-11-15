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

  let response: any = null

  if (name?.trim?.()) {
    response = await pokeApi(`/api/v2/pokemon/${name}`)
  } else {
    // TEMP: for now, let's suppose this one is not possible!
    return reply.callNotFound();

    // urlApiPokemon += "?limit=20&offset=20";
  }

  if (response == null) {
    return reply.callNotFound();
  }

  // TEMP: for now, do not compute! :)
  // computeResponse(response);

  reply.send(response);
}

export async function computeResponse(response: unknown) {
  const resp = response as any;

  const types = resp.types
    .map((type) => type.type)
    .map((type) => {
      return type.url;
    })
    .reduce((types, typeUrl) => types.push(typeUrl));

  const pokemonTypes = [];

  types.forEach((element) => {
    // const keepAliveAgent = new http.Agent({ keepAlive: true });

    http.request({ hostname: element }, (response) =>
      pokemonTypes.push(response)
    );
  });

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
