const { getLeagueData } = require("./_github");

function computeStats(data) {
  const table = {};

  for (const team of data.teams) {
    table[team.id] = {
      id: team.id,
      name: team.name,
      logo: team.logo || "",
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    };
  }

  for (const match of data.matches) {
    const a = table[match.team1Id];
    const b = table[match.team2Id];
    if (!a || !b) continue;

    a.played++;
    b.played++;

    a.gf += match.team1Goals;
    a.ga += match.team2Goals;

    b.gf += match.team2Goals;
    b.ga += match.team1Goals;

    if (match.team1Goals > match.team2Goals) {
      a.wins++;
      b.losses++;
      a.pts += 3;
    } else if (match.team1Goals < match.team2Goals) {
      b.wins++;
      a.losses++;
      b.pts += 3;
    } else {
      a.draws++;
      b.draws++;
      a.pts += 1;
      b.pts += 1;
    }
  }

  Object.values(table).forEach(t => {
    t.gd = t.gf - t.ga;
  });

  const pointsTable = Object.values(table).sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.gd !== x.gd) return y.gd - x.gd;
    if (y.gf !== x.gf) return y.gf - x.gf;
    return x.name.localeCompare(y.name);
  });

  return {
    updatedAt: data.updatedAt,
    teams: data.teams,
    matches: data.matches,
    pointsTable
  };
}

module.exports = async function handler(req, res) {
  try {
    const data = await getLeagueData();
    const computed = computeStats(data);
    return res.json(computed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
