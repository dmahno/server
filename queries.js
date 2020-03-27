const axios = require('axios');

axios.default
  .post('http://localhost:3000/api/settings', {
    repoName: 'https://github.com/dmahno/shri-async-second-task',
    buildCommand: 'npm run build',
    mainBranch: 'master',
    period: 667
  })
  .then();
