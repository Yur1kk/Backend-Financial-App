const { pool } = require('../Backend/database');
const bcrypt = require('bcrypt');

async function handleSearchFinances(userId, dateQuery) {
  try {
    const data = await pool.query(`
      SELECT finances.incomes, date.month, finances.spending_on_house, finances.spending_on_products, finances.spending_on_entertainment, finances.remains
      FROM date
      JOIN finances ON finances.month_id = date.id
      WHERE date.month LIKE ? AND finances.user_id = ?
      ORDER BY date.id
    `, [`%${dateQuery}%`, userId]);

    const finances = data[0];

    finances.forEach(finance => {
      // Ensure the values are strings before calling replace
      if (typeof finance.incomes === 'string') {
        finance.incomes = parseFloat(finance.incomes.replace(/\s/g, ''));
      }
      if (typeof finance.spending_on_house === 'string') {
        finance.spending_on_house = parseFloat(finance.spending_on_house.replace(/\s/g, ''));
      }
      if (typeof finance.spending_on_products === 'string') {
        finance.spending_on_products = parseFloat(finance.spending_on_products.replace(/\s/g, ''));
      }
      if (typeof finance.spending_on_entertainment === 'string') {
        finance.spending_on_entertainment = parseFloat(finance.spending_on_entertainment.replace(/\s/g, ''));
      }

      finance.remains = finance.incomes - (finance.spending_on_house + finance.spending_on_products + finance.spending_on_entertainment);
    });

    return finances;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function handleAddFinances({ userId, selectedMonth, incomes, spending_on_house, spending_on_products, spending_on_entertainment }) {
  try {
    if (userId && selectedMonth) {
      const findMonthQuery = 'SELECT id FROM date WHERE month = ?';
      const [monthResult] = await pool.query(findMonthQuery, [selectedMonth]);

      if (monthResult.length > 0) {
        const monthId = monthResult[0].id;

        const updateFinancesQuery = `
          INSERT INTO finances (user_id, month_id, incomes, spending_on_house, spending_on_products, spending_on_entertainment, remains)
          VALUES (?, ?, ?, ?, ?, ?, 0)
          ON DUPLICATE KEY UPDATE
          incomes = VALUES(incomes),
          spending_on_house = VALUES(spending_on_house),
          spending_on_products = VALUES(spending_on_products),
          spending_on_entertainment = VALUES(spending_on_entertainment),
          remains = 0;
        `;

        await pool.query(updateFinancesQuery, [userId, monthId, incomes, spending_on_house, spending_on_products, spending_on_entertainment]);
        return 'Фінанси успішно оновлені';
      } else {
        return 'Місяця з такою назвою не існує';
      }
    } else {
      return 'Не вказано користувача або місяць для оновлення фінансів';
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function handleDeleteFinances(userId, monthToDelete) {
  try {
    const findMonthQuery = 'SELECT id FROM date WHERE month = ?';
    const [monthResult] = await pool.query(findMonthQuery, [monthToDelete]);

    if (monthResult.length === 0) {
      throw new Error(`Місяць ${monthToDelete} не знайдено`);
    }

    const monthId = monthResult[0].id;

    const deleteFinancesQuery = `
      DELETE FROM finances
      WHERE user_id = ? AND month_id = ?
    `;

    await pool.query(deleteFinancesQuery, [userId, monthId]);

    return `Планування за місяць ${monthToDelete} видалено`;
  } catch (error) {
    console.error(error);
    throw error;
  }
}


async function generateChartData(userId) {
  try {
    const data = await pool.query(`
      SELECT date.month, finances.incomes, 
      SUM(finances.spending_on_house + finances.spending_on_products + finances.spending_on_entertainment) as totalExpenses
      FROM date
      JOIN finances ON finances.month_id = date.id
      WHERE finances.user_id = ?
      GROUP BY date.month
      ORDER BY date.id
    `, [userId]);

    return data[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}
  
async function generateMainData() {
  try {
      const data = await pool.query('SELECT * FROM date');
      return data[0];
  } catch (error) {
      console.error(error);
      throw error;
  }
}

async function registerUser(username, password) {
  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser[0].length > 0) {
      throw new Error('Користувач з таким іменем вже існує');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);

    return result.insertId; 
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function loginUser(username, password) {
  try {
    const user = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!user[0][0]) {
      throw new Error('Користувача з таким іменем не існує');
    }

    const isPasswordValid = await bcrypt.compare(password, user[0][0].password_hash);
    if (!isPasswordValid) {
      throw new Error('Неправильний пароль');
    }

    return user[0][0].id; 
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  handleSearchFinances,
  handleDeleteFinances,
  handleAddFinances,
  generateChartData,
  generateMainData,
  registerUser,
  loginUser,
};
