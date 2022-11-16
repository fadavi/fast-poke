import { strict as assert } from "assert";
import { equalsIgnoreCase, httpError } from "./utils";

const { it, describe } = require("node:test");

describe("utils", () => {
  describe("httpError", () => {
    it("returns an Error having the status property", () => {
      const err = httpError(321);
      assert.equal(err.status, 321);
    });

    it("returns an Error having provided message", () => {
      const err = httpError(500, "fake error");
      assert.equal(err.message, "fake error");
    });

    it("returns an Error having the provided cause Error", () => {
      const cause = new Error("a fake cause");
      const err = httpError(500, "another fake error", cause);
      assert.equal((err as any).cause, cause);
    });
  });

  describe("equalsIgnoreCase", () => {
    it("returns true when the arguments are identical", () => {
      assert.equal(equalsIgnoreCase("Some-String", "Some-String"), true);
    });

    it("returns true for nil args", () => {
      assert.equal(equalsIgnoreCase(null as any, null as any), true);
      assert.equal(equalsIgnoreCase(null as any, undefined as any), true);
      assert.equal(equalsIgnoreCase(undefined as any, null as any), true);
      assert.equal(equalsIgnoreCase(undefined as any, undefined as any), true);
    });

    it("returns true if the args represent the same string", () => {
      assert.equal(equalsIgnoreCase(true as any, "true"), true);
      assert.equal(equalsIgnoreCase(false as any, "false"), true);
      assert.equal(equalsIgnoreCase("1234", 1234 as any), true);
      assert.equal(equalsIgnoreCase("NaN", NaN as any), true);
      assert.equal(equalsIgnoreCase("-Infinity", -Infinity as any), true);

      // false positive
      assert.equal(equalsIgnoreCase({ x: "y" } as any, {} as any), true);
    });

    it("returns false when exactly one of the args is nil", () => {
      assert.equal(equalsIgnoreCase(null as any, "null"), false);
      assert.equal(equalsIgnoreCase("undefined", undefined as any), false);
    });

    it("returns true when the args are the same strings (case-insens)", () => {
      assert.equal(equalsIgnoreCase(" Snake_Case\t", " snake_case\t"), true);
    });

    it("does not trim the args", () => {
      assert.equal(equalsIgnoreCase(" str ", "str"), false);
    });

    it("returns false for different strings (case-insens)", () => {
      assert.equal(equalsIgnoreCase("foo", "bar"), false);
    });
  });
});
