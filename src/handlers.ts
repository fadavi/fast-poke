import { FastifyRequest, FastifyReply } from "fastify";

import { pokeApi, computeStatsAverage } from "./lib/poke-api";
import { Pokemon } from "./models/Pokemon";
import { httpError } from "./lib/utils";

export async function getPokemonByNameOrID(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const nameOrID: string = request.params["nameOrID"];

  try {
    const pokemon: Pokemon = await pokeApi(`/api/v2/pokemon/${nameOrID}`);

    // mutates `pokemon`:
    const pokemonWithStatAverage = await computeStatsAverage(pokemon);
    reply.send(pokemonWithStatAverage);
  } catch (err) {
    if (!err.status) {
      return reply.send(httpError(500, "", err));
    } else if (err.status === 404) {
      return reply.send(httpError(404, "", err));
    }

    return reply.header("retry-after", 120).send(httpError(503, "", err));
  }
}
