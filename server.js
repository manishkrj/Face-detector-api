const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const mysql = require('mysql2'); // Use mysql2

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'smartbrain',
};

const pool = mysql.createPool(dbConfig).promise(); // Use the promise-based API

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT email, hash FROM login WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json('wrong credentials');
    }
    const isValid = bcrypt.compareSync(password, rows[0].hash);
    if (isValid) {
      const [userRows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (userRows.length === 0) {
        return res.status(400).json('unable to get user');
      }
      res.json(userRows[0]);
    } else {
      res.status(400).json('wrong credentials');
    }
  } catch (err) {
    res.status(400).json('wrong credentials');
    // console.log(err)
  }
});

app.post('/register', async (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  try {
    const [loginRows] = await pool.execute('INSERT INTO login (email, hash) VALUES (?, ?)', [email, hash]);
    const [userRows] = await pool.execute('INSERT INTO users (email, name, joined) VALUES (?, ?, ?)', [email, name, new Date()]);
    res.json({ email, name, joined: new Date() });
  } catch (err) {
    res.status(400).json('error creating user');
  }
});

app.get('/profile/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(400).json('Not found');
    }
    res.json(userRows[0]);
  } catch (err) {
    res.status(400).json('error getting user');
  }
});

app.put('/image', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.execute('UPDATE users SET entries = entries + 1 WHERE id = ?', [id]);
    const [entriesRows] = await pool.execute('SELECT entries FROM users WHERE id = ?', [id]);
    if (entriesRows.length === 0) {
      return res.status(400).json('unable to get entries');
    }
    res.json(entriesRows[0].entries);
  } catch (err) {
    res.status(400).json('unable to update entries');
  }
});

app.listen(3000, () => {
  console.log('app is running on port 3000');
});