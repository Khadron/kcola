
const App = require('../core');

const app = new App(__dirname);

app.listen('9527', (err) => {
  if (err) {
    console.dir(err);
    return;
  }
  console.log(`***************Listening at localhost:9527***************`);
});
