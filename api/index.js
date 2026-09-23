const { app, initializeDatabase } = require('../server/src');

let databaseInitialization;

module.exports = async (req, res) => {
  if (!databaseInitialization) {
    databaseInitialization = initializeDatabase();
  }

  try {
    await databaseInitialization;
    return app(req, res);
  } catch (error) {
    databaseInitialization = null;
    console.error('Vercel API initialization failed:', error);
    return res.status(500).json({ message: 'API initialization failed.' });
  }
};