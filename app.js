const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());
const settings = JSON.parse(fs.readFileSync(`${__dirname}/api/settings.json`));

//i would add an api app.get('/api/v1/settings') to detect a version;
app.get('/api/settings', (req, res) => {
  res.status(200).json({
    status: 'success',
    // helps people to understand how many settings have been sent in JSON
    results: settings.length,
    data: {
      settings
    }
  });
});

app.post('/api/settings', (req, res) => {
  console.log(req.body);
  res.send('Done');
});

const port = 3002;

app.listen(port, () => {
  console.log('App runing');
});
