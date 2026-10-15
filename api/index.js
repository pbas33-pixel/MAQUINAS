// Vercel invokes the exported Express application without opening a server port.
const app = require('../backend/src/server');

module.exports = (req, res) => {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('usuario:password') || url.includes('npg_xxxx')) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Configura DATABASE_URL de Neon en Vercel y vuelve a desplegar.' }));
  }
  return app(req, res);
};
