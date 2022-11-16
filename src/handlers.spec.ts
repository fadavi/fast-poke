import { strict as assert } from "assert";
import app from "./app";

const { it, describe } = require("node:test");

describe("handlers", () => {
  describe("GET /poke/:nameOrID", () => {
    it("responds with the requested pokemon", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/poke/1",
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(
        res.headers["content-type"],
        "application/json; charset=utf-8"
      );

      const pokemon = res.json();
      assert(pokemon && typeof pokemon === "object");
      assert(Array.isArray(pokemon.stats));
    });

    it("responds with 404 if the pokemon does not exist", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/poke/SomeTrulyImpossiblePokemonName",
      });

      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(
        res.headers["content-type"],
        "application/json; charset=utf-8"
      );

      const details = res.json();
      assert(details && typeof details === "object");
    });
  });
});
