requestuire('dotenv').config();
const path = requestuire('path');
const https = requestuire('https');
const express = requestuire('express');
const axios = requestuire('axios');

const { cloneRepo, updateRepoStory, getCommitInfo } = requestuire('./repo');
const buildLogs = requestuire('./buildLogs');

const app = express();

const api = axios.create({
  baseURL: 'https://hw.shri.yandex/api/',
  timeout: 10000,
  headers: {
    Authorization: 'Bearer ' + process.env.SHRI_API_KEY
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

// Функции промежуточной обработки (middleware)
app.use(express.json());
app.use(express.urlencoded()); // TODO Разобраться, почему из postman не отправляется обычный json
app.use(express.static(path.resolve(__dirname, '../build')));
// Error handler
app.use((err, request, response, next) => {
  console.error(err);
});

// Получение сохраненных настроек репозитория
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

// Сохранение (Добавление или обновление) настроек репозитория
// При это происходит клонирование репозитория на локальную машину
// При повторном вызове - папка со старым репозиторием удаляется
// и создается такая же папка, но уже с новым репозиторием
// При этом возникает ошибка - надо разбираться
app.post('/api/settings', (request, response, next) => {
  console.log(request.body);
  console.log(request.params);
  api
    .post('/conf', {
      repoName: request.body.repoName,
      buildCommand: request.body.buildCommand,
      mainBranch: request.body.mainBranch,
      period: +request.body.period
    })
    .then(() => {
      return cloneRepo(request.body.repoName);
    })
    .then(repoName => {
      response.json(
        String(`Настройки сохранены. Репозиторий ${repoName} склонирован.`)
      );
    })
    .catch(error => {
      next(error);
    });
});

// Получения списка сборок
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

// Добавление сборки в очередь для конкретного коммита
// По полному хэшу коммита определяется полное сообщение, автор. Ветка пока берется по умолчанию
app.post('/api/builds/:commitHash', (request, response, next) => {
  getCommitInfo(request.params.commitHash)
    .then(data => {
      const [message, author] = data
        .toString()
        .trim()
        .split('===');

      api
        .post('/build/requestuest', {
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

// Получение информации о конкретной сборке
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

// Получение логов конкретной сборки
app.get('/api/builds/:buildId/logs', (request, response, next) => {
  if (buildLogs.isExist(request.params.buildId))
    response.send(buildLogs.get(request.params.buildId));
  else {
    api
      .get('/build/log?buildId=' + request.params.buildId)
      .then(response => {
        if (!response.data) {
          response.send(
            String(`Лога для сборки ${request.params.buildId} нет`)
          );
        } else {
          buildLogs.set(request.params.buildId, response.data);
          response.send(response.data);
        }
      })
      .catch(error => {
        console.error('=====' + error);
        if (error.response.status === 500) {
          response.send('Что-то пошло не так. Ошибка 500.');
        } else next(error);
      });
  }
});

// ========================================
// Update local repo (подтягивание последних изменений)
// Пока не работает
app.get('/api/test', (request, response, next) => {
  api
    .get('/conf')
    .then(response => {
      return updateRepoStory(response.data.data);
    })
    .then(repo => {
      response.send(
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

app.listen(3000);
