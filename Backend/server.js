const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Chart = require('chart.js');
const { generateMainPage,
  generateSearchPage,
  generateDeleteFinancesPage,
  generateAddFinancesPage,
  generateAddFinancesSuccessPage,
  generateDeleteFinancesSuccessPage,
  generateChartsPage,
  generateLoginPage,
  generateRegistrationPage,
  generateLogoutPage } = require('../Frontend/templates');
const { pool } = require('./database');
const {
  handleSearchFinances,
  handleDeleteFinances,
  handleAddFinances,
  registerUser,
  loginUser
} = require('./api');

const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;
let isAuthenticated = false;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'scrtky', 
  resave: false,
  saveUninitialized: true
}));

const currencyConverterPath = path.join(__dirname, '../CurrencyConverter');
app.use('/CurrencyConverter', express.static(currencyConverterPath));

app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.userId;
  next();
});

app.get('/', async (req, res) => {
  try {
    const mainPage = await generateMainPage(res.locals.isAuthenticated);
    res.send(mainPage);
  } catch (error) {
    console.error(error);
    res.status(404).send(`Not found: ${error.message}`);
  }
});

app.get('/search', async (req, res) => {

  if (isAuthenticated) {
    try {
      const userId = req.session.userId; 
      const dateQuery = req.query.date_query || '';
      

      const financesData = await handleSearchFinances(userId, dateQuery);

      const searchPage = await generateSearchPage(dateQuery, financesData);
      res.send(searchPage);
    } catch (error) {
      console.error(error);
      res.status(404).send(`Not found: ${error.message}`);
    }
  } else {
    res.status(401).send(`
      <script>
        alert('Для виконання цієї дії зареєструйтеся або увійдіть на сайт. Натисніть OK для переходу на сторінку авторизації.');
        window.location.href = '/';
      </script>
    `);
  }
});

app.get('/delete-finances/:month', async (req, res) => {
  const monthToDelete = req.params.month;
  const deleteFinancesPage = await generateDeleteFinancesPage(monthToDelete);
  res.send(deleteFinancesPage);
});

app.get('/add-finances', async (req, res) => {
  const addFinancesPage = await generateAddFinancesPage();
  res.send(addFinancesPage);
});

app.post('/add-finances', async (req, res) => {

  if (isAuthenticated) {
    try {
      const userId = req.session.userId; 
      const selectedMonth = req.body.selectedMonth; 
      const incomes = parseFloat(req.body.incomes.replace(/\s/g, ''));
      const spending_on_house = parseFloat(req.body.spending_on_house.replace(/\s/g, ''));
      const spending_on_products = parseFloat(req.body.spending_on_products.replace(/\s/g, ''));
      const spending_on_entertainment = parseFloat(req.body.spending_on_entertainment.replace(/\s/g, ''));

      console.log('Received form data:', req.body);

      const resultMessage = await handleAddFinances({
        userId,
        selectedMonth,
        incomes,
        spending_on_house,
        spending_on_products,
        spending_on_entertainment
      });

      const addFinancesSuccessPage = await generateAddFinancesSuccessPage();
      res.send(addFinancesSuccessPage);
    } catch (error) {
      console.error(error);
      res.status(500).send(`Internal Server Error: ${error.message}`);
    }
  } else {
    res.status(401).send(`
      <script>
        alert('Для виконання цієї дії зареєструйтеся або увійдіть на сайт. Натисніть OK для переходу на сторінку авторизації.');
        window.location.href = '/';
      </script>
    `);
  }
});



app.delete('/delete-finances/:month', async (req, res) => {
  if (isAuthenticated) {
    try {
      const userId = req.session.userId;
      const monthToDelete = req.params.month;
      await handleDeleteFinances(userId, monthToDelete);
      const deleteFinancesSuccessPage = await generateDeleteFinancesSuccessPage(monthToDelete);
      res.send(deleteFinancesSuccessPage);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(401).send(`
      <script>
        alert('Для виконання цієї дії зареєструйтеся або увійдіть на сайт. Натисніть OK для переходу на сторінку авторизації.');
        window.location.href = '/';
      </script>
    `);
  }
});

app.get('/delete-finances-success', async (req, res) => {
  const monthToDelete = req.query.month; // отримуємо місяць з запиту
  try {
    const deleteFinancesSuccessPage = await generateDeleteFinancesSuccessPage(monthToDelete);
    res.send(deleteFinancesSuccessPage);
  } catch (error) {
    console.error(error);
    res.status(404).send(`Not found: ${error.message}`);
  }
});


app.get('/charts', async (req, res) => {

  if (isAuthenticated) {
    try {
      const userId = req.session.userId; 
      const chartsPage = await generateChartsPage(userId);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(chartsPage);
    } catch (error) {
      console.error(error);
      res.status(404).send(`Not found: ${error.message}`);
    }
  } else {
    res.status(401).send(`
      <script>
        alert('Для виконання цієї дії зареєструйтеся або увійдіть на сайт. Натисніть OK для переходу на сторінку авторизації.');
        window.location.href = '/';
      </script>
    `);
  }
});

app.get('/login', async (req, res) => {
  try {
    const loginPage = await generateLoginPage();
    res.send(loginPage);
  } catch (error) {
    console.error(error);
    res.status(404).send(`Not found: ${error.message}`);
  }
});

app.get('/register', async (req, res) => {
  try {
    const registrationPage = await generateRegistrationPage();
    res.send(registrationPage);
  } catch (error) {
    console.error(error);
    res.status(404).send(`Not found: ${error.message}`);
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = await registerUser(username, password);

    req.session.userId = userId;
    isAuthenticated = true;

    res.status(200).send(`
      <script>
        alert('Реєстрацію завершено успішно. Натисніть OK для переходу на сторінку логіну.');
        window.location.href = '/login';
      </script>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send(`
    <script>
      alert('Користувач з таким іменем вже існує. Натисніть OK для повторної реєстрації.');
      window.location.href = '/register';
    </script>
  `);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = await loginUser(username, password);

    req.session.userId = userId;
    isAuthenticated = true;

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(401).send(`
    <script>
      alert('Користувача з таким іменем не існує. Натисніть OK для повторної авторизації.');
      window.location.href = '/login';
    </script>
  `);
  }
});

app.get('/logout', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          isAuthenticated = false;
          resolve();
        }
      });
    });

    const logoutPage = await generateLogoutPage(res.locals.isAuthenticated);
    res.send(logoutPage);
  } catch (error) {
    console.error(error);
    res.status(404).send('Not found');
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

