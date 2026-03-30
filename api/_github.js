const GITHUB_API = "https://api.github.com";

function getConfig() {
  return {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || "main",
    path: process.env.GITHUB_FILE_PATH || "data/league.json"
  };
}

async function getFile() {
  const { token, owner, repo, branch, path } = getConfig();

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  if (res.status === 404) {
    return { exists: false, sha: null, json: null };
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub read failed: ${txt}`);
  }

  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return {
    exists: true,
    sha: data.sha,
    json: JSON.parse(content)
  };
}

async function saveFile(jsonData, message = "Update league data") {
  const { token, owner, repo, branch, path } = getConfig();
  const existing = await getFile();

  const body = {
    message,
    content: Buffer.from(JSON.stringify(jsonData, null, 2)).toString("base64"),
    branch
  };

  if (existing.exists && existing.sha) {
    body.sha = existing.sha;
  }

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub write failed: ${txt}`);
  }

  return await res.json();
}

function defaultLeagueData() {
  return {
    updatedAt: new Date().toISOString(),
    teams: [
      {
        id: "sagor",
        name: "SAGOR FC",
        logo: "",
        passwordKey: "TEAM_SAGOR_PASSWORD"
      },
      {
        id: "emon",
        name: "EMON FC",
        logo: "",
        passwordKey: "TEAM_EMON_PASSWORD"
      },
      {
        id: "zihad",
        name: "ZIHAD FC",
        logo: "",
        passwordKey: "TEAM_ZIHAD_PASSWORD"
      },
      {
        id: "antor",
        name: "ANTOR FC",
        logo: "",
        passwordKey: "TEAM_ANTOR_PASSWORD"
      }
    ],
    matches: []
  };
}

async function getLeagueData() {
  const file = await getFile();
  if (!file.exists || !file.json) {
    const initial = defaultLeagueData();
    await saveFile(initial, "Create initial league data");
    return initial;
  }
  return file.json;
}

module.exports = {
  getLeagueData,
  saveFile,
  defaultLeagueData
};
