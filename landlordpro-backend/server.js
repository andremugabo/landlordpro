const express = require('express');
const app = express();
const PORT = 3000;


const setupSwagger = require('./swagger');

app.use(express.json());



setupSwagger(app);


app.get('/', (req,res) =>{
    res.send('LandLord Pro Backend is Healthy!!');
});

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));