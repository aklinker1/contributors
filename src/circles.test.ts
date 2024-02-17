import { circles, type Circle } from "./circles";
import { describe, it, expect } from "bun:test";

function expectCircleToBeEqual(actual: Circle, expected: Circle) {
  expect(actual.x).toBeCloseTo(expected.x);
  expect(actual.y).toBeCloseTo(expected.y);
  expect(actual.r).toBe(expected.r);
}

describe("Circle Utils", () => {
  describe("findTangentCircles", () => {
    it("should return the 2 tangent circles with same x", () => {
      const c1: Circle = {
        x: 0,
        y: 0,
        r: 3,
      };
      const c2: Circle = {
        x: 5,
        y: 0,
        r: 2,
      };
      const r3 = 1;
      const expected: [Circle, Circle] = [
        {
          x: 16 / 5,
          y: 12 / 5,
          r: r3,
        },
        {
          x: 16 / 5,
          y: -12 / 5,
          r: r3,
        },
      ];

      const actual = circles.findTangentCircles(c1, c2, r3);

      expectCircleToBeEqual(actual[0], expected[0]);
      expectCircleToBeEqual(actual[1], expected[1]);
    });

    it("should return the 2 tangent circles with same y", () => {
      const c1: Circle = {
        x: 0,
        y: 0,
        r: 3,
      };
      const c2: Circle = {
        x: 0,
        y: 5,
        r: 2,
      };
      const r3 = 1;
      const expected: [Circle, Circle] = [
        {
          x: -12 / 5,
          y: 16 / 5,
          r: r3,
        },
        {
          x: 12 / 5,
          y: 16 / 5,
          r: r3,
        },
      ];

      const actual = circles.findTangentCircles(c1, c2, r3);

      expectCircleToBeEqual(actual[0], expected[0]);
      expectCircleToBeEqual(actual[1], expected[1]);
    });
  });
});
