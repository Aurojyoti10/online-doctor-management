const app = require('./app');

const port = Number.parseInt(process.env.PORT, 10) || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
