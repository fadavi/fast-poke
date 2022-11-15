import { FastifyRequest, FastifyReply } from "fastify";
// import { PokemonWithStats } from "models/PokemonWithStats";
import * as http from "http";

export async function getPokemonByName(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const name: string = request.params["name"];

  reply.headers["Accept"] = "application/json";

  let urlApiPokeman = "https://pokeapi.co/api/v2/pokemon/";

  const params = {};

  name == null
    ? name.trim() != ""
      ? ((params["name"] = name),
        (urlApiPokeman = urlApiPokeman + "/"),
        (urlApiPokeman = urlApiPokeman + name))
      : ((urlApiPokeman = urlApiPokeman + "?offset=20"),
        (urlApiPokeman = urlApiPokeman + "&limit=20"))
    : ((urlApiPokeman = urlApiPokeman + "?offset=20"),
      (urlApiPokeman = urlApiPokeman + "&limit=20"));


  // const keepAliveAgent = new http.Agent({ keepAlive: true });

  let response: any = "";

  http.request(
    { ...reply.headers, ...{ hostname: urlApiPokeman, port: 80 } },
    (result) => {
      response = result;
    }
  );

  if (response == null) {
    reply.code(404);
  }

  computeResponse(response);

  reply.send(response);

  return reply;
}

export const computeResponse = async (
  response: unknown,
) => {
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
};
