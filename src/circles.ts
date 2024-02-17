export const circles = {
  /**
   * Returns the two points that a third circle, with radius `r3`, would be tangent to both other
   * circles.
   *
   * Because of how the problem is laid out, this math is vastly simplified. There will always be
   * two solutions based on the "bubble" layout we're attempting to create.
   *
   * I'm using the fact that two circles, expanded by r3, will interset at the center of a third,
   * tangent circle. See
   * ![Example chart](https://github.com/wxt-dev/wxt/assets/10101283/a4958f87-bfa9-40dc-8a60-18b8e4a4a6f4)
   * or https://www.desmos.com/calculator/mke6zrodi5
   */
  findTangentCircles(c1: Circle, c2: Circle, r3: number): Circle[] {
    // Calculate the distance between the centers of c1 and c2
    const d = Math.hypot(c2.x - c1.x, c2.y - c1.y);

    // No solution if the circles are too far apart
    if (d > c1.r + c2.r + 2 * r3) return [];

    // Solve SSS, where A is the angle away from c1's center to reach the center of c3
    const a = c2.r + r3;
    const b = c1.r + r3;
    const c = c1.r + c2.r;
    const A = Math.acos((b ** 2 + c ** 2 - a ** 2) / (2 * b * c));

    // Calculate the angle between the line connecting the centers and the x-axis
    const theta = Math.atan2(c2.y - c1.y, c2.x - c1.x);

    // Find the two possible center points
    const alphas = [theta + A, theta - A];
    return alphas.map((alpha) => ({
      x: c1.x + b * Math.cos(alpha),
      y: c1.y + b * Math.sin(alpha),
      r: r3,
    }));
  },
  isIntersecting(c1: Circle, c2: Circle): boolean {
    const d = Math.hypot(c2.x - c1.x, c2.y - c1.y);
    // Increase the distance a little bit to account for floating point arithmatic
    return d + 0.005 < c1.r + c2.r;
  },
  findNextCircle(
    existingCircles: Array<Circle & { id: number }>,
    r: number
  ): Circle {
    // Find all possible locations
    const alreadyAdded = new Set<string>();
    const combos = existingCircles.flatMap((c1) =>
      existingCircles.flatMap((c2) => {
        if (c1 === c2) return [];
        const key = [c1.id, c2.id].toSorted().join();
        if (alreadyAdded.has(key)) return [];
        alreadyAdded.add(key);
        return [[c1, c2]];
      })
    );
    const tangentCircles = combos.flatMap(([c1, c2]) =>
      this.findTangentCircles(c1, c2, r)
    );
    const possibleCircles = tangentCircles.filter(
      (c) => !existingCircles.find((ec) => circles.isIntersecting(c, ec))
    );

    if (possibleCircles.length === 0) {
      console.warn("Could not find possible circle for:", {
        tangentCircles,
        possibleCircles,
      });
      return { x: 0, y: 0, r };
    }

    // Return the one closest to the center
    return possibleCircles
      .map((a) => ({ ...a, weight: positionWeight(a.x, a.y) }))
      .toSorted((l, r) => r.weight - l.weight)
      .shift()!;
  },
};

export interface Circle {
  x: number;
  y: number;
  r: number;
}

function positionWeight(x: number, y: number): number {
  return squareWeight(x, y, 16, 9);
}

/**
 * https://www.desmos.com/3d/9765364706
 */
function squareWeight(x: number, y: number, w: number, h: number): number {
  return -Math.abs(x / w + y / h) - Math.abs(y / h - x / w);
}
