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

    const {
      date,
      team1Id,
      team2Id,
      team1Goals,
      team2Goals,
      note = ""
    } = req.body || {};

    if (!team1Id || !team2Id || team1Id === team2Id) {
      return res.status(400).json({ error: "Invalid teams" });
    }

    if (
      team1Goals === undefined ||
      team2Goals === undefined ||
      Number.isNaN(Number(team1Goals)) ||
      Number.isNaN(Number(team2Goals))
    ) {
      return res.status(400).json({ error: "Invalid goals" });
    }

    const data = await getLeagueData();

    const match = {
      id: Date.now(),
      date: date || new Date().toISOString().slice(0, 10),
      team1Id,
      team2Id,
      team1Goals: Number(team1Goals),
      team2Goals: Number(team2Goals),
      note,
      createdAt: new Date().toISOString()
    };

    data.matches.unshift(match);
    data.updatedAt = new Date().toISOString();

    await saveFile(data, `Add match ${team1Id} vs ${team2Id}`);
    return res.json({ ok: true, match });
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
};
