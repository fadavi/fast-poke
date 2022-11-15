import { FastifyInstance } from "fastify";
import { getPokemonByNameOrID } from "./handlers";

export default async function router(fastify: FastifyInstance) {
  fastify.get(
    "/poke/:nameOrID",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            nameOrID: {
              type: "string",
              minLength: 1,
              maxLength: 64,
              pattern: "^[0-9A-Za-z ]+$",
            },
          },
        },
      },
    },
    getPokemonByNameOrID
  );
}
