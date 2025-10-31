const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',       
  password: '123456',
  database: 'cross_table_system'
});

db.connect(err => {
  if (err) {
    console.error('数据库连接失败：', err);
  } else {
    console.log('MySQL 数据库连接成功');
  }
});

module.exports = db;
