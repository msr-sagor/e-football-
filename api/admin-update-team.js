const jwt = require("jsonwebtoken");
const { getLeagueData, saveFile } = require("./_github");

function verifyToken(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");
  if (!token) throw new Error("No token");
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = verifyToken(req);
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { teamId, name, logo } = req.body || {};
    if (!teamId) {
      return res.status(400).json({ error: "teamId required" });
    }

    const data = await getLeagueData();
    data.teams = data.teams.map(t => {
      if (t.id !== teamId) return t;
      return {
        ...t,
        name: name ?? t.name,
        logo: logo ?? t.logo
      };
    });

    data.updatedAt = new Date().toISOString();
    await saveFile(data, `Update team ${teamId}`);
    return res.json({ ok: true, teams: data.teams });
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
};
