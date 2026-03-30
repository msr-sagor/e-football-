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

    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "Match id required" });
    }

    const data = await getLeagueData();
    data.matches = data.matches.filter(m => String(m.id) !== String(id));
    data.updatedAt = new Date().toISOString();

    await saveFile(data, `Delete match ${id}`);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
};
