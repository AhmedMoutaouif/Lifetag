const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const { readTokenFromRequest } = require("../utils/authCookie");

/** JWT + DB: le rôle et le statut viennent toujours de la base (pas du payload JWT ni du localStorage). */
const authMiddleware = async (req, res, next) => {
  const token = readTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, status: true }
    });
    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Session invalide ou compte désactivé" });
    }
    req.user = { userId: user.id, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

module.exports = { authMiddleware, adminMiddleware };
