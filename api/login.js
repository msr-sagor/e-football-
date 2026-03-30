const jwt = require("jsonwebtoken");

const teamMap = {
  sagor: {
    teamId: "sagor",
    teamName: "SAGOR FC",
    envKey: "TEAM_SAGOR_PASSWORD"
  },
  emon: {
    teamId: "emon",
    teamName: "EMON FC",
    envKey: "TEAM_EMON_PASSWORD"
  },
  zihad: {
    teamId: "zihad",
    teamName: "ZIHAD FC",
    envKey: "TEAM_ZIHAD_PASSWORD"
  },
  antor: {
    teamId: "antor",
    teamName: "ANTOR FC",
    envKey: "TEAM_ANTOR_PASSWORD"
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { role, password, teamId } = req.body || {};

    if (role === "admin") {
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid admin password" });
      }

      const token = jwt.sign(
        { role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({ ok: true, token, role: "admin" });
    }

    if (role === "team") {
      const team = teamMap[teamId];
      if (!team) {
        return res.status(400).json({ error: "Invalid team" });
      }

      const realPassword = process.env[team.envKey];
      if (password !== realPassword) {
        return res.status(401).json({ error: "Invalid team password" });
      }

      const token = jwt.sign(
        {
          role: "team",
          teamId: team.teamId,
          teamName: team.teamName
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        ok: true,
        token,
        role: "team",
        teamId: team.teamId,
        teamName: team.teamName
      });
    }

    return res.status(400).json({ error: "Invalid role" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
