const swaggerJsdoc = require('swagger-jsdoc');

const servers = [
  { url: 'http://localhost:5000', description: 'Local' },
];

if (process.env.BACKEND_URL) {
  servers.unshift({ url: process.env.BACKEND_URL, description: 'Production' });
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Events Platform API',
      version: '1.0.0',
      description: 'API documentation for Events ticket booking platform',
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);