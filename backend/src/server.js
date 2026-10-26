
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the project root BEFORE importing the app.
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const app = require('./app');

const port = Number.parseInt(process.env.PORT, 10) || 5001;

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.on('error', (error) => {
  console.error('Backend server failed to start:', error.message);
  process.exitCode = 1;
});
