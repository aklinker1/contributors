import { github, type GithubContributor } from "./github";
import { circles, type Circle } from "./circles";
import { LRUCache } from "lru-cache";

const baseRadius = 50;
const gap = 10;
const outlineWidth = 2;
const cache = new LRUCache<string, string>({
  max: 500,
  ttl: 2.592e8, // 3 days
});

console.log("Server started @ https://localhost:3000");
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    let [owner, repo] = url.pathname.substring(1).split("/");
    repo = repo.replace(".svg", "");
    if (!owner || !repo) {
      return JsonResponse(
        {
          error: `Request must be in the form: ${url.origin}/<owner>/<repo>.svg`,
        },
        { status: 400 }
      );
    }

    const cacheKey = `${owner}/${repo}`;
    let cachedSvg = cache.get(cacheKey);
    if (cachedSvg != null) return SvgResponse(cachedSvg);

    const contributors = (await github.getContributors(owner, repo))
      .toSorted((l, r) => r.contributions - l.contributions)
      .filter((u) => !u.login.includes("[bot]"))
      .map((u) => ({ ...u, scale: 1 * Math.log(u.contributions) + 1 }));

    // TODO: Remove, just for testing
    // contributors.length = 7;

    // Calculate placements
    const placements: Array<GithubContributor & Circle> = [];
    contributors.forEach((contributor, i) => {
      const r = contributor.scale * baseRadius;
      if (i === 0) {
        placements.push({ ...contributor, x: 0, y: 0, r });
        return;
      }
      if (i === 1) {
        const prevR = contributors[0].scale * baseRadius;
        placements.push({ ...contributor, x: prevR + gap + r, y: 0, r });
        return;
      }

      const next = circles.findNextCircle(
        placements.map((c) => ({ ...c, r: c.r + gap / 2 })),
        r + gap / 2
      );
      placements.push({
        ...contributor,
        ...next,
        r,
      });
    });

    const bounds = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
    };
    placements.forEach((c) => {
      bounds.left = Math.min(bounds.left, c.x - c.r);
      bounds.bottom = Math.min(bounds.bottom, c.y - c.r);
      bounds.right = Math.max(bounds.right, c.x + c.r);
      bounds.top = Math.max(bounds.top, c.y + c.r);
    });
    bounds.left = Math.floor(bounds.left - Math.max(gap, 1));
    bounds.bottom = Math.floor(bounds.bottom - Math.max(gap, 1));
    bounds.right = Math.ceil(bounds.right + Math.max(gap, 1));
    bounds.top = Math.ceil(bounds.top + Math.max(gap, 1));
    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.top - bounds.bottom;

    const svgDefs = placements
      .map(
        ({ id, r, x, y }) =>
          `<mask id="${id}"><circle cx="${x}" cy="${y}" r="${r}" fill="white" /></mask>`
      )
      .join("");
    const svgImages = placements
      .map(
        ({ id, avatar_url, r, x, y }) =>
          `<image xlink:href="${avatar_url}" width="${r * 2}" height="${
            r * 2
          }" x="${x - r}" y="${y - r}" mask="url(#${id})" />`
      )
      .join("");
    const svgOutlines = placements
      .map(
        ({ r, x, y }) =>
          `<circle cx="${x}" cy="${y}" r="${r}" stroke="#808080" stroke-width="${outlineWidth}" fill="none" />`
      )
      .join("");

    const svg = `<svg viewBox="${bounds.left} ${bounds.bottom} ${bounds.width} ${bounds.height}"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        ${svgDefs}
      </defs>
      ${svgImages}
      ${svgOutlines}
    </svg>`;
    cache.set(cacheKey, svg);

    return SvgResponse(svg);
  },
});

function JsonResponse(object: any, init?: ResponseInit) {
  return new Response(JSON.stringify(object), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

function SvgResponse(svg: string, init?: ResponseInit) {
  return new Response(svg, {
    ...init,
    headers: {
      "Content-Type": "image/svg+xml",
      ...init?.headers,
    },
  });
}
