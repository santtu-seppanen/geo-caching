import { base64ToUtf8, utf8ToBase64 } from "./base64.js";
import type { LoytoPyynto } from "./validointi.js";

export interface GithubEnv {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
}

const LOYDOT_POLKU = "app/src/data/loydot.json";

interface Loyto extends LoytoPyynto {
  aika: string;
}

/**
 * Hakee nykyisen loydot.json:in GitHubista, liittää uuden löydön ja
 * kirjoittaa tiedoston takaisin GitHub Contents API:n kautta. Tämä tekee
 * commitin suoraan `branch`-haaraan, mikä laukaisee Pages-buildin.
 */
export async function kirjaaLoytoGithubiin(
  pyynto: LoytoPyynto,
  env: GithubEnv,
): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${LOYDOT_POLKU}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "paikka-halytin-worker",
    Accept: "application/vnd.github+json",
  };

  const nykyinenVastaus = await fetch(
    `${apiUrl}?ref=${env.GITHUB_BRANCH}`,
    { headers },
  );
  if (!nykyinenVastaus.ok) {
    throw new Error(
      `loydot.jsonin haku GitHubista epäonnistui: ${nykyinenVastaus.status}`,
    );
  }
  const nykyinen = (await nykyinenVastaus.json()) as {
    content: string;
    sha: string;
  };

  const loydot = JSON.parse(base64ToUtf8(nykyinen.content)) as Loyto[];
  loydot.push({ ...pyynto, aika: new Date().toISOString() });

  const paivitysVastaus = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Lisää löytö: ${pyynto.nimi} – ${pyynto.paikkaId}`,
      content: utf8ToBase64(JSON.stringify(loydot, null, 2) + "\n"),
      sha: nykyinen.sha,
      branch: env.GITHUB_BRANCH,
    }),
  });

  if (!paivitysVastaus.ok) {
    throw new Error(
      `loydot.jsonin päivitys GitHubiin epäonnistui: ${paivitysVastaus.status}`,
    );
  }
}
