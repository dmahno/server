const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const app = express();

app.use(express.json());
const { cloneRepo, updateRepoStory, getCommitInfo } = require('./repo');
const buildLogs = require('./buildLogs');

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

app.get('/api/settings', (req, res, next) => {
  api
    .get('/conf')
    .then(response => {
      res.json(response.data);
    })
    .catch(error => {
      next(error);
    });
});
app.post('/api/settings', (req, res, next) => {
  console.log(req.body);
  console.log(req.params);
  api
    .post('/conf', {
      repoName: req.body.repoName,
      buildCommand: req.body.buildCommand,
      mainBranch: req.body.mainBranch,
      period: +req.body.period
    })
    .then(() => {
      return cloneRepo(req.body.repoName);
    })
    .then(repoName => {
      res.json(
        String(`Настройки сохранены. Репозиторий ${repoName} склонирован.`)
      );
    })
    .catch(error => {
      next(error);
    });
});
app.get('/api/builds', (req, res, next) => {
  api
    .get('/build/list')
    .then(response => {
      res.json(response.data);
    })
    .catch(error => {
      next(error);
    });
});
app.post('/api/builds/:commitHash', (req, res, next) => {
  getCommitInfo(req.params.commitHash)
    .then(data => {
      const [message, author] = data
        .toString()
        .trim()
        .split('===');

      api
        .post('/build/request', {
          commitMessage: message,
          commitHash: req.params.commitHash,
          branchName: 'master',
          authorName: author
        })
        .then(() => {
          res.json({ message: message, author: author });
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

app.get('/api/builds/:buildId', (req, res, next) => {
  api
    .get('/build/details?buildId=' + req.params.buildId)
    .then(response => {
      res.json(response.data);
    })
    .catch(error => {
      next(error);
    });
});

app.get('/api/builds/:buildId/logs', (req, res, next) => {
  if (buildLogs.isExist(req.params.buildId))
    res.send(buildLogs.get(req.params.buildId));
  else {
    api
      .get('/build/log?buildId=' + req.params.buildId)
      .then(response => {
        if (!response.data) {
          res.send(String(`Лога для сборки ${req.params.buildId} нет`));
        } else {
          buildLogs.set(req.params.buildId, response.data);
          res.send(response.data);
        }
      })
      .catch(error => {
        console.error('=====' + error);
        if (error.response.status === 500) {
          res.send('Что-то пошло не так. Ошибка 500.');
        } else next(error);
      });
  }
});

app.get('/api/test', (req, res, next) => {
  api
    .get('/conf')
    .then(response => {
      return updateRepoStory(response.data.data);
    })
    .then(repo => {
      res.send(
        String(
          `История ветки ${repo.mainBranch} репозитория ${repo.repoName} обновлена`
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
// app.get(myURL, (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     // helps people to understand how many settings have been sent in JSON
//     results: settings.length,
//     data: {
//       settings
//     }
//   });
// });

// app.post('/api/settings', (req, res) => {
//   //creating a new id to my setting data
//   const newId = settings[settings.length - 1].id + 1;
//   const newSetting = Object.assign({ id: newId }, req.body);
//   settings.push(newSetting);
//   fs.writeFile(
//     `${__dirname}/api/settings.json`,
//     JSON.stringify(settings),
//     err => {
//       res.status(201).json({
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
