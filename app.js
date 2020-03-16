const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const app = express();
app.use(express.json());

const {
  cloneRepository,
  updateRepositoryStory,
  getCommitInfo
} = require('./repository');
const logs = require('./logs');

const api = axios.create({
  baseURL: 'https://hw.shri.yandex/api/',
  timeout: 5000,
  headers: {
    Authorization: 'Bearer ' + process.env.SHRI_API_KEY
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.resolve(__dirname, '../build')));
// Error
app.use(err => {
  console.error(err);
});

app.get('/api/settings', (request, response, next) => {
  api
    .get('/conf')
    .then(response => {
      response.json(response.data);
    })
    .catch(error => {
      next(error);
    });
});
app.post('/api/settings', (request, response, next) => {
  console.log(request.body);
  console.log(request.params);
  api
    .post('/conf', {
      repositoryName: request.body.repositoryName,
      buildCommand: request.body.buildCommand,
      mainBranch: request.body.mainBranch,
      period: +request.body.period
    })
    .then(() => {
      return cloneRepository(request.body.repositoryName);
    })
    .then(repositoryName => {
      response.json(
        String(
          `Settings were saved& The repository ${repositoryName} has been cloned.`
        )
      );
    })
    .catch(error => {
      next(error);
    });
});
app.get('/api/builds', (request, response, next) => {
  api
    .get('/build/list')
    .then(response => {
      response.json(response.data);
    })
    .catch(error => {
      next(error);
    });
});
app.post('/api/builds/:commitHash', (request, response, next) => {
  getCommitInfo(request.params.commitHash)
    .then(data => {
      const [message, author] = data
        .toString()
        .trim()
        .split('===');

      api
        .post('/build/request', {
          commitMessage: message,
          commitHash: request.params.commitHash,
          branchName: 'master',
          authorName: author
        })
        .then(() => {
          response.json({ message: message, author: author });
        })
        .catch(error => {
          next(error);
        });
    })
    .catch(error => {
      next(error);
      console.error(error);
    });
});

app.get('/api/builds/:buildId', (request, response, next) => {
  api
    .get('/build/details?buildId=' + request.params.buildId)
    .then(response => {
      response.json(response.data);
    })
    .catch(error => {
      next(error);
    });
});

app.get('/api/builds/:buildId/logs', (request, response, next) => {
  if (logs.isExist(request.params.buildId))
    response.send(logs.get(request.params.buildId));
  else {
    api
      .get('/build/log?buildId=' + request.params.buildId)
      .then(response => {
        if (!response.data) {
          response.send(
            String(`There is no log ${request.params.buildId} for build`)
          );
        } else {
          logs.set(request.params.buildId, response.data);
          response.send(response.data);
        }
      })
      .catch(error => {
        console.error('=====' + error);
        if (error.response.status === 500) {
          response.send('Error 500.');
        } else next(error);
      });
  }
});

app.get('/api/test', (request, response, next) => {
  api
    .get('/conf')
    .then(response => {
      return updateRepositoryStory(response.data.data);
    })
    .then(repository => {
      response.send(
        String(
          `The history of repository ${repository.repositoryName} branch ${repository.mainBranch} has been updated`
        )
      );
    })
    .catch(err => {
      console.error(err);
      next(err);
    });
});
// const express = require('express');
// const fs = require('fs');
// const fetch = require('node-fetch');
// const app = express();

// app.use(express.json());

// app.get('/settings', async (request, response) => {
//   const apiUrl = 'https://hw.shri.yandex/api/build/list?limit=25';
//   let fetchResponse = await fetch(apiUrl);
//   const json = await fetchResponse.json();
//   return json;
// });

// if (response.ok) { // если HTTP-статус в диапазоне 200-299
//   // получаем тело ответа (см. про этот метод ниже)
//   let json = await response.json();
// } else {
//   alert("Ошибка HTTP: " + response.status);
// }

// const app = express();
// app.use(express.json());
// const settings = JSON.parse(fs.readFileSync(myURL));

// //readFileSync(`${__dirname}/api/settings.json`)
// //i would add an api app.get('/api/v1/settings') to detect a version;
// app.get(myURL, (request, res) => {
//   response.status(200).json({
//     status: 'success',
//     // helps people to understand how many settings have been sent in JSON
//     results: settings.length,
//     data: {
//       settings
//     }
//   });
// });

// app.post('/api/settings', (request, res) => {
//   //creating a new id to my setting data
//   const newId = settings[settings.length - 1].id + 1;
//   const newSetting = Object.assign({ id: newId }, request.body);
//   settings.push(newSetting);
//   fs.writeFile(
//     `${__dirname}/api/settings.json`,
//     JSON.stringify(settings),
//     err => {
//       response.status(201).json({
//         status: 'success',
//         data: {
//           setting: newSetting
//         }
//       });
//     }
//   );
// });

const port = 3002;

app.listen(port, () => {
  console.log(`App server is runing ${port}`);
});
