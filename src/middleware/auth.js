const jwt = require('jsonwebtoken');
const database = require('../config/database');
const logger = require('../utils/logger');

const authentifizierung = async (req, res, next) => {
  try {
    let token;

    // Token aus Header holen
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Sicherstellen, dass Token existiert
    if (!token) {
      return res.status(401).json({
        erfolg: false,
        nachricht: 'Nicht berechtigt, auf diese Route zuzugreifen'
      });
    }

    try {
      // Token überprüfen
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Benutzer aus Datenbank holen
      const result = await database.query(
        'SELECT kunden_id, email, vorname, nachname, ist_aktiv, ist_verifiziert FROM kunden WHERE kunden_id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          erfolg: false,
          nachricht: 'Token ist nicht mehr gültig'
        });
      }

      const benutzer = result.rows[0];

      // Prüfen, ob Benutzer aktiv ist
      if (!benutzer.ist_aktiv) {
        return res.status(401).json({
          erfolg: false,
          nachricht: 'Benutzerkonto ist deaktiviert'
        });
      }

      // Benutzer zur Anfrage hinzufügen
      req.benutzer = benutzer;
      next();
    } catch (err) {
      logger.error('JWT-Überprüfungsfehler:', err);
      return res.status(401).json({
        erfolg: false,
        nachricht: 'Nicht berechtigt, auf diese Route zuzugreifen'
      });
    }
  } catch (err) {
    logger.error('Auth-Middleware-Fehler:', err);
    return res.status(500).json({
      erfolg: false,
      nachricht: 'Serverfehler'
    });
  }
};

module.exports = { authentifizierung };