export const github = {
  getContributors: async (
    owner: string,
    repo: string,
    limit = Infinity,
  ): Promise<GithubContributor[]> => {
    let allRes: GithubContributor[] = [];
    let pageRes: GithubContributor[] = [];
    let i = 1;
    do {
      pageRes = await getContributors(owner, repo, i);
      i++;
      allRes.push(...pageRes);
    } while (pageRes.length > 0 && allRes.length < limit);
    if (allRes.length > limit) {
      allRes.length = limit;
    }
    return allRes;
  },
};

async function getContributors(
  owner: string,
  repo: string,
  page = 1,
): Promise<GithubContributor[]> {
  const headers = process.env.GITHUB_TOKEN
    ? { Authentication: `Bearer ${process.env.GITHUB_TOKEN}` }
    : undefined;
  const url = `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100&page=${page}`;
  const res = await fetch(url, {
    // proxy: proxies[1],
    headers,
  });
  if (res.status !== 200) {
    console.error(res.headers, await res.text());
    throw Error("Fetch request failed with code " + res.status);
  }
  return await res.json();
}

export interface GithubContributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
}

export const proxies = [
  undefined,
  "http://143.198.12.168:3128",
  "http://167.172.228.48:3129",
  "http://167.71.90.227:3130",
];
