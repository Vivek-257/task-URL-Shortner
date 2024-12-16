// require('dotenv').config()


// const express = require('express');
// const { connectToDatabase } = require('./src/utils/db.js');

// const app = express();

// (async () => {
//   await connectToDatabase();

//   app.listen(3000, () => {
//     console.log("Server running on port 3000");
//   });
// })();


const express = require('express');
require('dotenv').config()
const { connectToDatabase } = require('./src/utils/db.js');
const urlRoutes = require('./src/routes/urlRoutes.js');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/api', urlRoutes);

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to database', err);
});


