import { FastifyInstance } from 'fastify';
import { getPokemonByName } from "./handlers";

export default async function router(fastify: FastifyInstance) {
  fastify.get("/poke/:name", {
    schema: {
      params: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 64,
            pattern: "^[0-9A-Za-z ]+$",
          },
        },
      },
    },
  }, getPokemonByName);
}
