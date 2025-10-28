const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const setupSwagger = require('./swagger');
const userRoutes = require('./src/routes/userRoutes'); 
const propertyRoutes = require('./src/routes/propertyRoutes');
const localRoutes = require('./src/routes/localRoutes');
const tenantRoutes = require('./src/routes/tenantRoutes');
const leaseRoutes = require('./src/routes/leaseRoutes');
const paymentModeRoutes = require('./src/routes/paymentModeRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes')
const expenseRoutes = require('./src/routes/expenseRoutes');
const floorRouter = require('./src/routes/floorRouter')

// Middleware
app.use(express.json());

// Enable CORS for your frontend
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true, 
}));

// This line - serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname,'uploads')));


// Routes
app.use('/api', userRoutes);
app.use('/api', propertyRoutes);
app.use('/api',localRoutes);
app.use('/api',tenantRoutes);
app.use('/api', leaseRoutes);
app.use('/api', paymentModeRoutes);
app.use('/api',paymentRoutes);
app.use('/api',expenseRoutes);
app.use('/api',floorRouter);

// Swagger
setupSwagger(app);

// Health check
app.get('/', (req, res) => {
    res.send('LandLord Pro Backend is Healthy!!');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
