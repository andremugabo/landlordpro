const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const setupSwagger = require('./swagger');
const userRoutes = require('./src/routes/userRoutes'); 
const propertyRoutes = require('./src/routes/propertyRoutes');

// Middleware
app.use(express.json());

// Enable CORS for your frontend
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, 
}));

// Routes
app.use('/api', userRoutes);
app.use('/api', propertyRoutes);

// Swagger
setupSwagger(app);

// Health check
app.get('/', (req, res) => {
    res.send('LandLord Pro Backend is Healthy!!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
