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
    console.error('[Vercel API] Database initialization failed:', {
      name: error.name,
      message: error.message
    });
    return res.status(500).json({
      success: false,
      message: 'API initialization failed.'
    });
  }
};