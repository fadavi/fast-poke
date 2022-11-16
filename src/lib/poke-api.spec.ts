import { strict as assert } from "assert";
import { pokeApi, computeStatsAverage } from "./poke-api";
import { Pokemon } from "../models/Pokemon";

const { it, describe, beforeEach } = require("node:test");

describe("poke-api", () => {
  describe("pokeApi", () => {
    it("throws 404 error when the requested pokemon is not found", async () => {
      try {
        await pokeApi("/api/v2/pokemon/some_truly_impossible_pokemon_name");
      } catch (err) {
        assert.strictEqual(err.status, 404, `Unexpected error status: ${err.status}`);
        return;
      }

      assert.fail("No error has been thrown at all!");
    });

    it("resolves the pokemon object", async () => {
      let pokemon: Pokemon | undefined;

      try {
        pokemon = await pokeApi("/api/v2/pokemon/1");
      } catch (err) {
        assert.fail(err);
      }

      assert(pokemon && typeof pokemon === "object");
      assert(Array.isArray(pokemon.stats));
      assert(Array.isArray(pokemon.types));
    });
  });

  describe("computeStatsAverage", () => {
    let pokemon: Pokemon;

    beforeEach(async () => pokemon = await pokeApi("/api/v2/pokemon/1"));

    it("adds averageStat to stat objects of the pokemon", async () => {
      const result = await computeStatsAverage(pokemon);
      assert(result && typeof result === "object");

      for (const stat of result.stats) {
        assert.strictEqual(typeof stat.averageStat, "number");
      }
    })
  });
})
