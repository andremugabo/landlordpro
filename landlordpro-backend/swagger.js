const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


const options = {
    definition: {
      openapi: '3.0.0',
      info: { title: 'Backend API', version: '1.0.0', description: 'Landlord Pro  APIs' },
      servers: [
        { url: 'http://localhost:3000', description: 'Local development server' },
        { url: 'https://api.landlordpro.rw', description: 'Production server' }
      ],
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./docs/swagger/*.js'],
  };
  
  const specs = swaggerJsDoc(options);
  
  function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }
  
  module.exports = setupSwagger;