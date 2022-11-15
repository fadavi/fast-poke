import { IncomingMessage } from "http";
import * as https from "https";

import { httpError, equalsIgnoreCase } from "./utils";
import { Type } from "../models/Type";
import {
  Pokemon,
  PokemonStat,
  PokemonWithStatAverage,
} from "../models/Pokemon";

const APPLICATION_JSON = "application/json";

const aliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
  maxFreeSockets: 5,
});

export async function pokeApi<R>(
  absolutePath: string,
  options: Record<string, any> = {}
) {
  const url = new URL(absolutePath, "https://pokeapi.co");
  url.search = String(new URLSearchParams(options));

  const requestOptions: https.RequestOptions = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    agent: aliveAgent,
    headers: { Accept: APPLICATION_JSON },
  };

  return new Promise<R>((resolve, reject) => {
    const chunks: string[] = [];

    const onError = (err: any) => reject(httpError(503, "", err));

    const onData = chunks.push.bind(chunks);

    const onEnd = () => {
      try {
        resolve(JSON.parse(chunks.join("")));
      } catch (err) {
        reject(httpError(503, "", err));
      }
    };

    const onResponse = (res: IncomingMessage) => {
      const isJSON = res.headers["content-type"]?.includes?.(APPLICATION_JSON);
      const isSuccessful = [200, 201].includes(res.statusCode);

      if (!isJSON || !isSuccessful) {
        reject(httpError(res.statusCode === 404 ? 404 : 503));
        return res.resume();
      }

      res.setEncoding("utf8").on("data", onData).on("end", onEnd);
    };

    https.get(requestOptions, onResponse).on("error", onError);
  });
}

/**
 * Calculates average of base stat for each stat of the `pokemon`.
 * But, according to PokeApi docs, `Type` model hasn't got a `stat` property.
 * So, I decided to change the spec. These PokeApi models are somehow related to
 * `stats` or `stat`:
 * 1. Evolution Chain
 * 2. Move
 * 3. Characteristic[?]
 * 4. Nature
 * 5. Pokeathlon Stat
 * 6. Pokemon
 * Beside that, among the models, the `base_stat` only exists in `Pokemon`. It's
 * my bet that the best option is to calculate the average stat among all
 * pokemons having a particular stat.
 */
export async function computeStatsAverage(
  _pokemon: Pokemon
): Promise<PokemonWithStatAverage> {
  const pokemon = _pokemon as PokemonWithStatAverage;

  const typeRequests: Promise<Type>[] = pokemon.types
    .map((t) => t.type.url)
    .map((url) => pokeApi<Type>(url).catch(() => null));
  const types = (await Promise.all(typeRequests)).filter(Boolean);

  const allStats = types.flatMap<PokemonStat>(
    /* HEADS UP: "Type" model hasn't got `stats` property:
     * https://pokeapi.co/docs/v2#types
     * Because of this, the result is always ZERO! */
    (type) => (type as Pokemon).stats ?? []
  );

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

  return pokemon;
}
