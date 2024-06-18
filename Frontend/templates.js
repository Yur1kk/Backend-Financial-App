const fs = require('fs').promises;
const { pool } = require('../Backend/database');
const { generateChartData, generateMainData } = require('../Backend/api');

async function generateMainPage(isAuthenticated) {
  try {
      const date = await generateMainData();
      const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');

      const loginButton = isAuthenticated
          ? ''
          : `<a href="/login">Вхід</a>`;
      
      const registrationButton = isAuthenticated
          ? ''
          : `<a href="/register">Реєстрація</a>`;

          const logoutButton = isAuthenticated
          ? `<a href="/logout">Вихід</a>`
          : '';

      const htmlContent = `
          <!DOCTYPE html>
          <html>
              <head>
                  <meta charset="UTF-8">
                  <title>Облік фінансів помісячно</title>
                  <style>
                      ${cssContent}
                      body {
                          margin: 0;
                          padding: 0;
                          display: flex;
                          flex-direction: column;
                          min-height: 100vh;
                      }
                      footer {
                          background-color: #f0f0f0;
                          text-align: center;
                          padding: 1rem;
                      }
                      .month-container {
                          text-align: left;
                          padding-left: 100px;
                      }
                      .delete-link {
                          display: block;
                          text-align: left;
                          margin-left: 1px;
                      }
                  </style>
              </head>
              <body>
                  <header>
                      <h1>
                      <div class="auth-buttons">
                         ${loginButton}
                          ${registrationButton}
                          ${logoutButton}
                          </div>
                      Облік фінансів помісячно
                      </h1>
                  </header>
                  <nav>
                      <ul>
                          <li><a href="/">Головна</a></li>
                          <li><a href="/search">Пошук фінансових планувань</a></li>
                          <li><a href="../CurrencyConverter/index.html" target="_self">Конвертер валют</a></li>
                          <li><a href="/charts">Графічна статистика планувань</a></li>
                      </ul>
                  </nav>
                  <main>
                      <h2>Список місяців</h2>
                      <ul>
                          ${date.map((month) => `
                              <li class="month-container">
                                  <a href="/add-finances?month=${encodeURIComponent(month.month)}">${month.month}</a>
                                  <a class="delete-link" href="/delete-finances/${encodeURIComponent(month.month)}">Обнулити планування</a>
                              </li>`).join('')}
                      </ul>
                  </main>
                  <footer>
                      &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
                  </footer>
              </body>
          </html>
      `;

      return htmlContent;
  } catch (error) {
      console.error(error);
      throw error;
  }
}

async function generateChartsPage(userId) {
  try {
    const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');
    const chartData = await generateChartData(userId); // Pass userId to generateChartData
  
    // Розділіть дані на місяці, доходи та витрати
    const months = chartData.map(row => row.month);
    const incomesData = chartData.map(row => row.incomes);
    const totalExpensesData = chartData.map(row => row.totalExpenses);
  
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Перегляд графіків</title>
            <style>
              ${cssContent}
              a {
                background-color: #f0f0f0;
                text-align: center;
                padding: 10px;
                margin-top: auto;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
              }
              footer {
                background-color: #f0f0f0;
                text-align: center;
                padding: 10px;
                margin-top: auto;
              }
            </style>
          </head>
          <body>
            <h1>Графіки фінансових планувань</h1>
            <a href="/">Повернутись на головну сторінку</a>
            <hr/>
            <div id="myChart"></div>
            <footer>
              &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
            </footer>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <script>
              const months = ${JSON.stringify(months)};
              const incomesData = ${JSON.stringify(incomesData)};
              const totalExpensesData = ${JSON.stringify(totalExpensesData)};
  
              // Отримайте посилання на div, в якому буде графік
              const chartDiv = document.getElementById('myChart');
  
              // Створіть дані для графіка
              const trace1 = {
                x: months,
                y: incomesData,
                name: 'Доходи',
                type: 'bar',
                marker: { color: 'rgba(75, 192, 192, 0.2)' },
              };
  
              const trace2 = {
                x: months,
                y: totalExpensesData,
                name: 'Витрати',
                type: 'bar',
                marker: { color: 'rgba(255, 0, 0, 0.2)' },
              };
  
              const data = [trace1, trace2];
  
              // Налаштування макету графіка
              const layout = {
                title: 'Стовпчаста статистика помісячно',
                xaxis: { title: 'Місяці' },
                yaxis: { title: 'Сума' },
              };
  
              // Побудова графіка
              Plotly.newPlot(chartDiv, data, layout);
            </script>
          </body>
        </html>
      `;
      return htmlContent;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  
  async function generateAddFinancesPage(selectedMonth) {
    try {
      const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');
  
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Додавання фінансів</title>
            <style>
              ${cssContent}
              body {
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
              }
              footer {
                background-color: #f0f0f0;
                text-align: center;
                padding: 1rem;
              }
            </style>
          </head>
          <body>
            <header>
              <h1>Додавання фінансів</h1>
            </header>
            <nav>
              <ul>
                <li><a href="/">Головна</a></li>
                <li><a href="/search">Пошук фінансових планувань</a></li>
                <li><a href="../CurrencyConverter/index.html" target="_self">Конвертер валют</a></li>
                <li><a href="/charts">Графічна статистика планувань</a></li>
              </ul>
            </nav>
            <main>
              <h2>Додати фінансове планування</h2>
              <form action="/add-finances" method="post">
                <label for="selectedMonth">Місяць:</label>
                <input type="text" id="selectedMonth" name="selectedMonth" required>
                <label for="incomes">Доходи:</label>
                <input type="text" id="incomes" name="incomes" required>
                <label for="spending_on_house">Витрати на житло:</label>
                <input type="text" id="spending_on_house" name="spending_on_house" required>
                <label for="spending_on_products">Витрати на продукти:</label>
                <input type="text" id="spending_on_products" name="spending_on_products" required>
                <label for="spending_on_entertainment">Витрати на розваги:</label>
                <input type="text" id="spending_on_entertainment" name="spending_on_entertainment" required>
                <button type="submit">Додати фінансове планування</button>
              </form>
            </main>
            <footer>
            &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
            </footer>
          </body>
        </html>
      `;
  
      return htmlContent;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
async function generateAddFinancesSuccessPage() {
  try {
    const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Фінансовий план успішно доданий</title>
          <style>
          ${cssContent}
          body {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          a {
            background-color: #f0f0f0;
            text-align: center;
            padding: 10px;
            margin-top: auto;
          }
          footer {
            background-color: #f0f0f0;
            text-align: center;
            padding: 10px;
            margin-top: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          table th,
          table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          table th {
            background-color: #f2f2f2;
          }
        </style>
        </head>
        <body>
          <header>
            <h1>Фінансовий план успішно доданий</h1>
          </header>
          <nav>
            <ul>
              <li><a href="/">Головна</a></li>
            </ul>
          </nav>
          <main>
            <h2>Перейдіть на головну</h2>
          </main>
          <footer>
          &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
          </footer>
        </body>
      </html>
    `;

    return htmlContent;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function generateDeleteFinancesSuccessPage() {
  try {
    const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Обнулення фінансового планування - Успішно</title>
          <style>
          ${cssContent}
          body {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          a {
            background-color: #f0f0f0;
            text-align: center;
            padding: 10px;
            margin-top: auto;
          }
          footer {
            background-color: #f0f0f0;
            text-align: center;
            padding: 10px;
            margin-top: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          table th,
          table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          table th {
            background-color: #f2f2f2;
          }
        </style>
        </head>
        <body>
          <header>
            <h1>Обнулення фінансового планування - Успішно</h1>
          </header>
          <nav>
            <ul>
              <li><a href="/">Головна</a></li>
            </ul>
          </nav>
          <main>
            <h2>Планування за місяць обнулено.</h2>
          </main>
          <footer>
          &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
          </footer>
        </body>
      </html>
    `;

    return htmlContent;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function generateLoginPage() {
  try {
    const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Вхід</title>
          <style>
          ${cssContent}
          body {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          a {
            background-color: #f0f0f0;
            text-align: center;
            padding: 10px;
            margin-top: auto;
          }
          footer {
            background-color: #f0f0f0;
            text-align: center;
            padding: 10px;
            margin-top: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          table th,
          table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          table th {
            background-color: #f2f2f2;
          }
        </style>
        </head>
        <body>
          <header>
            <h1>Вхід</h1>
          </header>
          <nav>
            <ul>
              <li><a href="/">Головна</a></li>
            </ul>
          </nav>
          <main>
            <h2>Введіть дані облікового запису для входу</h2>
            <form action="/login" method="post">
              <label for="username">Ім'я користувача:</label>
              <input type="text" id="username" name="username" required>
              <label for="password">Пароль:</label>
              <input type="password" id="password" name="password" required>
              <button type="submit">Увійти</button>
            </form>
          </main>
          <footer>
            &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
          </footer>
        </body>
      </html>
    `;

    return htmlContent;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function generateRegistrationPage() {
  try {
    const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Реєстрація</title>
          <style>
          ${cssContent}
          body {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          a {
            background-color: #f0f0f0;
            text-align: center;
            padding: 10px;
            margin-top: auto;
          }
          footer {
            background-color: #f0f0f0;
            text-align: center;
            padding: 10px;
            margin-top: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          table th,
          table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          table th {
            background-color: #f2f2f2;
          }
        </style>
        </head>
        <body>
          <header>
            <h1>Реєстрація</h1>
          </header>
          <nav>
            <ul>
              <li><a href="/">Головна</a></li>
            </ul>
          </nav>
          <main>
            <h2>Створіть свій обліковий запис</h2>
            <form action="/register" method="post">
              <label for="username">Ім'я користувача:</label>
              <input type="text" id="username" name="username" required>
              <label for="password">Пароль:</label>
              <input type="password" id="password" name="password" required>
              <button type="submit">Зареєструватись</button>
            </form>
          </main>
          <footer>
            &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
          </footer>
        </body>
      </html>
    `;

    return htmlContent;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function generateSearchPage(dateQuery, financesData) {
    try {
      const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');
  
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Облік фінансів помісячно</title>
            <style>
              ${cssContent}
              body {
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
              }
              a {
                background-color: #f0f0f0;
                text-align: center;
                padding: 10px;
                margin-top: auto;
              }
              footer {
                background-color: #f0f0f0;
                text-align: center;
                padding: 10px;
                margin-top: auto;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              table th,
              table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: center;
              }
              table th {
                background-color: #f2f2f2;
              }
            </style>
          </head>
          <body>
            <h1>Пошук ваших фінансових планувань</h1>
            <hr/>
            <a href="/">Повернутись на головну сторінку</a>
            <form method="get" action="/search">
              <input type="text" name="date_query" placeholder="Введіть місяць" value="${dateQuery ? dateQuery : ''}"/>
              <button type="submit">Шукати</button>
            </form>
            <a>Знайдено планувань: ${financesData.length}</a>
            <table>
              <thead>
                <tr>
                  <th>Місяць</th>
                  <th>Доходи</th>
                  <th>Витрати на житло</th>
                  <th>Витрати на продукти</th>
                  <th>Витрати на розваги</th>
                  <th>Залишок</th>
                </tr>
              </thead>
              <tbody>
                ${financesData.map(finance => `
                  <tr>
                    <td>${finance.month}</td>
                    <td>${finance.incomes} грн</td>
                    <td>${finance.spending_on_house} грн</td>
                    <td>${finance.spending_on_products} грн</td>
                    <td>${finance.spending_on_entertainment} грн</td>
                    <td>${finance.remains.toFixed(2)} грн</td>
                  </tr>`).join('')}
              </tbody>
            </table>
            <hr/>
            <footer>
              &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
            </footer>
          </body>
        </html>
      `;
  
      return htmlContent;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  async function generateDeleteFinancesPage(monthToDelete) {
    try {
      const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');
  
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Видалення планування за місяць</title>
            <style>
              ${cssContent}
              body {
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
              }
              footer {
                background-color: #f0f0f0;
                text-align: center;
                padding: 1rem;
              }
            </style>
          </head>
          <body>
            <header>
              <h1>Видалення планування за місяць</h1>
            </header>
            <nav>
              <ul>
                <li><a href="/">Головна</a></li>
                <li><a href="/search">Пошук фінансових планувань</a></li>
                <li><a href="../CurrencyConverter/index.html" target="_self">Конвертер валют</a></li>
                <li><a href="/charts">Графічна статистика планувань</a></li>
              </ul>
            </nav>
            <main>
              <h2>Ви впевнені, що хочете видалити планування за місяць ${monthToDelete}?</h2>
              <button id="delete-button">Так, видалити</button>
              <script>
                document.getElementById('delete-button').addEventListener('click', async () => {
                  const response = await fetch('/delete-finances/${encodeURIComponent(monthToDelete)}', {
                    method: 'DELETE'
                  });
                  if (response.ok) {
                    window.location.href = '/delete-finances-success';
                  } else {
                    alert('Помилка при видаленні планування.');
                  }
                });
              </script>
            </main>
            <footer>
              &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
            </footer>
          </body>
        </html>
      `;
  
      return htmlContent;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
 
async function generateLogoutPage(isAuthenticated) {
  try {
    const cssContent = await fs.readFile('./Frontend/styles.css', 'utf8');

    const logoutButton = isAuthenticated
      ? `<a href="/logout">Вихід</a>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Вихід</title>
          <style>
            ${cssContent}
            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            footer {
              background-color: #f0f0f0;
              text-align: center;
              padding: 1rem;
            }
          </style>
        </head>
        <body>
          <header>
            <h1>Ви успішно вийшли з облікового запису</h1>
          </header>
          <ul>
              <li><a href="/">Повернутись на головну</a></li>
            </ul>
          <main>
          </main>
          <footer>
            &copy; ${new Date().getFullYear()} Всі права захищено <a href="https://t.me/yur1kkk" target="_blank">Підтримка</a>
          </footer>
        </body>
      </html>
    `;

    return htmlContent;
  } catch (error) {
    console.error(error);
    throw error;
  }
}


module.exports = {
  generateMainPage,
  generateAddFinancesPage,
  generateAddFinancesSuccessPage,
  generateDeleteFinancesSuccessPage,
  generateSearchPage,
  generateDeleteFinancesPage,
  generateChartsPage,
  generateLoginPage,
  generateRegistrationPage,
  generateLogoutPage,
};