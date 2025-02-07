const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const path = require('path'); 

const app = express();

app.use(express.static(path.join(__dirname, 'public'))); 

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRoutes);

app.listen(3000, () => {
  console.log('Server running');
});
