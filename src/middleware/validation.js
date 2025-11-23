const Joi = require('joi');

// Validierungsschemas
const schemas = {
  // Kundenregistrierung
  kundenRegistrierung: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      'any.required': 'E-Mail ist erforderlich'
    }),
    passwort: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).required().messages({
      'string.min': 'Das Passwort muss mindestens 8 Zeichen lang sein',
      'string.pattern.base': 'Das Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten',
      'any.required': 'Passwort ist erforderlich'
    }),
    vorname: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Der Vorname muss mindestens 2 Zeichen lang sein',
      'string.max': 'Der Vorname darf nicht länger als 50 Zeichen sein',
      'any.required': 'Vorname ist erforderlich'
    }),
    nachname: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Der Nachname muss mindestens 2 Zeichen lang sein',
      'string.max': 'Der Nachname darf nicht länger als 50 Zeichen sein',
      'any.required': 'Nachname ist erforderlich'
    }),
    telefon: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]{10,15}$/).optional().messages({
      'string.pattern.base': 'Bitte geben Sie eine gültige Telefonnummer ein'
    }),
    geburtsdatum: Joi.date().max('now').optional(),
    strasse: Joi.string().max(255).required().messages({
      'any.required': 'Straße ist erforderlich'
    }),
    hausnummer: Joi.string().max(10).required().messages({
      'any.required': 'Hausnummer ist erforderlich'
    }),
    plz: Joi.string().pattern(/^[0-9]{5}$/).required().messages({
      'string.pattern.base': 'PLZ muss eine 5-stellige Zahl sein',
      'any.required': 'PLZ ist erforderlich'
    }),
    stadt: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Die Stadt muss mindestens 2 Zeichen lang sein',
      'any.required': 'Stadt ist erforderlich'
    }),
    bezirk: Joi.string().max(100).optional(),
    jahresverbrauch: Joi.number().integer().min(500).max(50000).optional().messages({
      'number.min': 'Der Jahresverbrauch muss mindestens 500 kWh betragen',
      'number.max': 'Der Jahresverbrauch darf nicht über 50.000 kWh liegen'
    }),
    haushaltgroesse: Joi.number().integer().min(1).max(20).optional().messages({
      'number.min': 'Die Haushaltsgröße muss mindestens 1 betragen',
      'number.max': 'Die Haushaltsgröße darf nicht über 20 liegen'
    }),
    bevorzugteSprache: Joi.string().valid('de', 'vi', 'en').default('de'),
    marketingEinverstaendnis: Joi.boolean().default(false),
    newsletterEinverstaendnis: Joi.boolean().default(false)
  }),

  // Kundenanmeldung
  kundenAnmeldung: Joi.object({
    email: Joi.string().email().required(),
    passwort: Joi.string().required()
  }),

  // Preisberechnung
  preisBerechnung: Joi.object({
    plz: Joi.string().pattern(/^[0-9]{5}$/).required().messages({
      'string.pattern.base': 'PLZ muss eine 5-stellige Zahl sein',
      'any.required': 'PLZ ist erforderlich'
    }),
    jahresverbrauch: Joi.number().integer().min(500).max(50000).optional().messages({
      'number.min': 'Der Jahresverbrauch muss mindestens 500 kWh betragen',
      'number.max': 'Der Jahresverbrauch darf nicht über 50.000 kWh liegen'
    }),
    haushaltgroesse: Joi.number().integer().min(1).max(20).optional().messages({
      'number.min': 'Die Haushaltsgröße muss mindestens 1 betragen',
      'number.max': 'Die Haushaltsgröße darf nicht über 20 liegen'
    }),
    tariftyp: Joi.string().valid('fest', 'dynamisch', 'gruen').optional().default('fest'),
    funnelId: Joi.string().optional(),
    // Smart Meter Felder
    hatSmartMeter: Joi.boolean().optional().default(false),
    moechteSmartMeter: Joi.boolean().optional().default(false),
    // Solar/PV Felder
    hatSolarPV: Joi.boolean().optional().default(false),
    moechteSolarPV: Joi.boolean().optional().default(false),
    // Elektromobilität
    hatElektroauto: Joi.boolean().optional().default(false),
    moechteElektroauto: Joi.boolean().optional().default(false),
    // Batteriespeicher
    hatBatterie: Joi.boolean().optional().default(false),
    moechteBatterie: Joi.boolean().optional().default(false)
  }),

  // Vertragsentwurf erstellen
  vertragsentwurfErstellen: Joi.object({
    kundenId: Joi.string().required(),
    kampagneId: Joi.string().required(),
    tarifId: Joi.number().integer().required(),
    geschaetzterJahresverbrauch: Joi.number().integer().min(500).max(50000).required(),
    vertragsbeginn: Joi.date().min('now').required(),
    zusatzbestimmungen: Joi.object().optional(),
    notizen: Joi.string().max(1000).optional()
  }),

  // Kunde aktualisieren
  kundeAktualisieren: Joi.object({
    vorname: Joi.string().min(2).max(50).optional(),
    nachname: Joi.string().min(2).max(50).optional(),
    telefon: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]{10,15}$/).optional(),
    strasse: Joi.string().max(255).optional(),
    hausnummer: Joi.string().max(10).optional(),
    plz: Joi.string().pattern(/^[0-9]{5}$/).optional(),
    stadt: Joi.string().min(2).max(100).optional(),
    bezirk: Joi.string().max(100).optional(),
    bevorzugteSprache: Joi.string().valid('de', 'vi', 'en').optional(),
    marketingEinverstaendnis: Joi.boolean().optional(),
    newsletterEinverstaendnis: Joi.boolean().optional()
  })
};

// Validierungs-Middleware-Factory
const validieren = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const fehler = error.details.map(detail => ({
        feld: detail.path.join('.'),
        nachricht: detail.message
      }));
      
      return res.status(400).json({
        erfolg: false,
        nachricht: 'Validierungsfehler',
        fehler
      });
    }
    
    next();
  };
};

module.exports = {
  validieren,
  schemas
};