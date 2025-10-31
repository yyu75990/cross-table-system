const db = require('../config/db');

/**
 * 新建数据表
 */
exports.createTable = (req, res) => {
  const { tableName, fields } = req.body;
  if (!tableName || !fields || fields.length === 0) {
    return res.status(400).json({ message: '表名和字段信息不能为空' });
  }

  // 校验主键：确保前端必须有一字段是主键
  const hasPrimary = fields.some(f => /primary\s+key/i.test(f.type));
  if (!hasPrimary) {
    return res.status(400).json({ message: '请至少设置一个字段为主键' });
  }

  // 只用前端传递的字段
  const columns = fields.map(f => `\`${f.name}\` ${f.type}`).join(', ');
  const sql = `CREATE TABLE \`${tableName}\` (${columns})`;

  db.query(sql, err => {
    if (err) {
      return res.status(500).json({ message: '创建表失败', error: err.sqlMessage || err });
    }
    res.json({ message: `表 ${tableName} 创建成功` });
  });
};

/**
 * 删除数据表
 */
exports.deleteTable = (req, res) => {
  const { tableName } = req.params

  // 检查是否被其他表引用
  const checkSql = `
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()
  `
  db.query(checkSql, [tableName], (err, results) => {
    if (err) return res.status(500).json({ message: '外键检查失败', error: err })

    if (results.length > 0) {
      return res.status(400).json({
        message: `表 ${tableName} 存在外键依赖，不能删除`,
        dependencies: results.map(r => r.TABLE_NAME)
      })
    }

    // 否则安全删除
    const sql = `DROP TABLE IF EXISTS \`${tableName}\``
    db.query(sql, err2 => {
      if (err2) return res.status(500).json({ message: '删除表失败', error: err2 })
      res.json({ message: `表 ${tableName} 已删除` })
    })
  })
}


/**
 * 获取所有表名
 */
exports.getTables = (req, res) => {
  const sql = `SHOW TABLES`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: '查询表失败', error: err });
    res.json(results.map(r => Object.values(r)[0]));
  });
};

/**
 * 查看表结构详情
 */
exports.getTableStructure = (req, res) => {
  const { tableName } = req.params;
  const sql = `DESCRIBE ${tableName}`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: '获取表结构失败', error: err });
    res.json(results);
  });
};

/**
 * 添加字段
 */
exports.addField = (req, res) => {
  const { tableName, fieldName, fieldType } = req.body;
  const sql = `ALTER TABLE ${tableName} ADD COLUMN ${fieldName} ${fieldType}`;
  db.query(sql, err => {
    if (err) return res.status(500).json({ message: '添加字段失败', error: err });
    res.json({ message: `字段 ${fieldName} 添加成功` });
  });
};

/**
 * 删除字段
 */
exports.deleteField = (req, res) => {
  const { tableName, fieldName } = req.body;
  if (!tableName || !fieldName) {
    return res.status(400).json({ message: '表名和字段名不能为空' });
  }

  const sql = `ALTER TABLE \`${tableName}\` DROP COLUMN \`${fieldName}\``;

  db.query(sql, err => {
    if (err) return res.status(500).json({ message: '删除字段失败', error: err });
    res.json({ message: `字段 ${fieldName} 已删除` });
  });
};

/**
 * 修改字段
 */
exports.modifyField = (req, res) => {
  const { tableName, oldName, newName, newType } = req.body;
  const sql = `ALTER TABLE ${tableName} CHANGE ${oldName} ${newName} ${newType}`;
  db.query(sql, err => {
    if (err) return res.status(500).json({ message: '修改字段失败', error: err });
    res.json({ message: `字段 ${oldName} 修改为 ${newName}` });
  });
};

/**
 * 设置表间外键关联
 * tableA 关联表（子表）
 * tableB 被关联表（主表）
 * fieldA 子表字段
 * fieldB 主表字段（通常是主键）
 */
exports.addRelation = (req, res) => {
  const { tableA, fieldA, tableB, fieldB } = req.body
  if (!tableA || !fieldA || !tableB || !fieldB) {
    return res.status(400).json({ message: '参数不完整' })
  }

  const constraintName = `fk_${tableA}_${fieldA}_${tableB}_${fieldB}`
  const sql = `
    ALTER TABLE ${tableA}
    ADD CONSTRAINT ${constraintName}
    FOREIGN KEY (${fieldA}) REFERENCES ${tableB}(${fieldB})
    ON UPDATE CASCADE
    ON DELETE RESTRICT
  `
  db.query(sql, err => {
    if (err) return res.status(500).json({ message: '外键创建失败', error: err })
    res.json({ message: `外键 ${constraintName} 创建成功` })
  })
}

/**
 * 查询指定表的外键依赖情况（包括作为主表和子表的）
 */
exports.getTableRelations = (req, res) => {
  const { tableName } = req.params
  const sql = `
    SELECT 
      CONSTRAINT_NAME, 
      TABLE_NAME AS referencing_table,
      COLUMN_NAME AS referencing_column,
      REFERENCED_TABLE_NAME AS referenced_table,
      REFERENCED_COLUMN_NAME AS referenced_column
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE 
      (TABLE_SCHEMA = DATABASE()) AND 
      (TABLE_NAME = ? OR REFERENCED_TABLE_NAME = ?)
  `
  db.query(sql, [tableName, tableName], (err, results) => {
    if (err) return res.status(500).json({ message: '查询外键失败', error: err })
    res.json(results)
  })
}

/**
 * 获取某表的数据
 */
exports.getTableData = (req, res) => {
  const { tableName } = req.params;
  const sql = `SELECT * FROM \`${tableName}\``;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: '获取表数据失败', error: err });
    res.json(results);
  });
};

/**
 * 插入一条数据
 */
exports.insertData = (req, res) => {
  const { tableName, data } = req.body;
  if (!tableName || !data) return res.status(400).json({ message: '参数不完整' });

  const keys = Object.keys(data).map(k => `\`${k}\``).join(', ');
  const values = Object.values(data);
  const placeholders = values.map(() => '?').join(', ');

  const sql = `INSERT INTO \`${tableName}\` (${keys}) VALUES (${placeholders})`;

  db.query(sql, values, err => {
    if (err) return res.status(500).json({ message: '插入失败', error: err });
    res.json({ message: '插入成功' });
  });
};

/**
 * 更新一条数据
 */
exports.updateData = (req, res) => {
  const { tableName, id, data, pkName, pkValue } = req.body;
  if (!tableName || !data) return res.status(400).json({ message: '参数不完整' });

  db.query(`DESCRIBE \`${tableName}\``, (err, cols) => {
    if (err) return res.status(500).json({ message: '表结构校验失败', error: err });
    const pkCol = pkName || ((cols.find(c => c.Key === 'PRI') || {}).Field);
    if (!pkCol) return res.status(400).json({ message: '未找到主键字段' });
    const whereVal = (pkValue !== undefined ? pkValue : (data && data[pkCol]) !== undefined ? data[pkCol] : id);
    if (whereVal === undefined) return res.status(400).json({ message: `未提供主键值(${pkCol})` });

    const updates = Object.keys(data)
      .filter(k => k !== pkCol)
      .map(k => `\`${k}\`=?`).join(', ');
    const values = Object.keys(data)
      .filter(k => k !== pkCol)
      .map(k => data[k]);

    if (!updates) return res.status(400).json({ message: '无可更新字段' });

    const sql = `UPDATE \`${tableName}\` SET ${updates} WHERE \`${pkCol}\`=?`;
    db.query(sql, [...values, whereVal], err2 => {
      if (err2) return res.status(500).json({ message: '更新失败', error: err2 });
      res.json({ message: '更新成功' });
    });
  });
};

/**
 * 删除一条数据（支持任意主键字段名）
 */
exports.deleteData = (req, res) => {
  const { tableName, id } = req.params;
  if (!tableName || id === undefined) return res.status(400).json({ message: '参数不完整' });
  db.query(`DESCRIBE \`${tableName}\``, (err, cols) => {
    if (err) return res.status(500).json({ message: '表结构校验失败', error: err });
    const pkCol = (cols.find(c => c.Key === 'PRI') || {}).Field || 'id';
    const sql = `DELETE FROM \`${tableName}\` WHERE \`${pkCol}\`=?`;
    db.query(sql, [id], err2 => {
      if (err2) return res.status(500).json({ message: '删除失败', error: err2 });
      res.json({ message: '删除成功' });
    });
  });
};

/**
 * 跨表条件预览（支持多表JOIN）
 */
exports.crossTableConditionPreview = async (req, res) => {
  let { condition } = req.body;
  
  const reg = /([\w\u4e00-\u9fa5]+)[.．｡。·•●]([\w\u4e00-\u9fa5]+)\s*=\s*'([^']*)'/g;
  let tables = [];
  let wheres = [];
  let tableFields = {}; 
  let match;
  while ((match = reg.exec(condition))) {
    tables.push(match[1]);
    if (!tableFields[match[1]]) tableFields[match[1]] = [];
    tableFields[match[1]].push({ field: match[2], value: match[3] });
  }
  tables = [...new Set(tables)];
  if (!tables.length) {
    return res.json({ count: 0, preview: [], fields: [] });
  }

  
  if (tables.length === 1) {
    const tbl = tables[0];
    const conditions = tableFields[tbl].map(f => `\`${f.field}\`='${f.value}'`);
    const sql = `SELECT * FROM \`${tbl}\` WHERE ${conditions.join(' AND ')} LIMIT 100`;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: 'SQL解析失败', error: err });
      const fields = rows[0] ? Object.keys(rows[0]) : [];
      res.json({ count: rows.length, preview: rows, fields });
    });
    return;
  }

  
  const infoSql = `SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND (TABLE_NAME IN (${tables.map(t => `'${t}'`).join(',')}) 
      OR REFERENCED_TABLE_NAME IN (${tables.map(t => `'${t}'`).join(',')}))`;

  db.query(infoSql, async (err, keys) => {
    if (err) return res.status(500).json({ message: '外键信息获取失败', error: err });
    
    let baseTable = tables[0];
    let used = { [baseTable]: true };
    let joins = [];
    
    for (let round = 0; round < tables.length - 1; round++) {
      let found = false;
      for (let t1 of tables) {
        if (!used[t1]) continue;
        for (let t2 of tables) {
          if (used[t2]) continue;
          
          let k = keys.find(k => 
            ((k.TABLE_NAME===t1 && k.REFERENCED_TABLE_NAME===t2) || 
             (k.TABLE_NAME===t2 && k.REFERENCED_TABLE_NAME===t1)) && k.REFERENCED_TABLE_NAME && k.REFERENCED_COLUMN_NAME
          );
          if (k) {
            if (k.TABLE_NAME === t1) {
              joins.push(`LEFT JOIN \`${t2}\` ON \`${t1}\`.\`${k.COLUMN_NAME}\` = \`${t2}\`.\`${k.REFERENCED_COLUMN_NAME}\``);
              used[t2] = true;
            } else {
              joins.push(`LEFT JOIN \`${t1}\` ON \`${t2}\`.\`${k.COLUMN_NAME}\` = \`${t1}\`.\`${k.REFERENCED_COLUMN_NAME}\``);
              used[t1] = true;
            }
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) break;
    }
    
    if (Object.keys(used).length < tables.length) {
      return res.json({ count: 0, preview: [], fields: [], message: '多表缺乏外键关系，无法自动Join' });
    }

    let whereArr = [];
    for (let tbl of tables) {
      const conds = (tableFields[tbl] || []).map(f => `\`${tbl}\`.\`${f.field}\`='${f.value}'`);
      if (conds.length) whereArr.push(...conds);
    }
    let allFields = '*'; 
    const sql = `SELECT ${allFields} FROM \`${baseTable}\` ${joins.join(' ')}${whereArr.length ? ' WHERE ' + whereArr.join(' AND ') : ''} LIMIT 100`;
    db.query(sql, (err2, rows) => {
      if (err2) return res.status(500).json({ message: 'SQL解析失败', error: err2, sql });
      const fields = rows[0] ? Object.keys(rows[0]) : [];
      res.json({ count: rows.length, preview: rows, fields });
    });
  });
};

/**
 * 查询历史批量更新日志
 */
exports.getUpdateLogs = (req, res) => {
  const sql = `SELECT * FROM update_log ORDER BY time DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: '查询日志失败', error: err });
    res.json(results);
  });
};

/**
 * 跨表批量更新，永久记录日志+记录更新前的值
 * body: {condition, table, field, value, operator}
 * 
 */
exports.crossTableBatchUpdate = async (req, res) => {
  let { condition, table, field, value, operator } = req.body;
  
  if (!/^[\w\u4e00-\u9fa5]+$/.test(table) || !/^[\w\u4e00-\u9fa5]+$/.test(field)) return res.status(400).json({ message: '表名或字段非法' });
  if (field === 'id') return res.status(400).json({ message: '不允许批量更新主键字段' });
  const reg = /([\w\u4e00-\u9fa5]+)[.．｡。·•●]([\w\u4e00-\u9fa5]+)\s*=\s*'([^']*)'/g;
  let wheres = [];
  let m;
  while ((m = reg.exec(condition))) {
    if ((m[1] || '').replace(/\s+/g, '').toLowerCase() === (table || '').replace(/\s+/g, '').toLowerCase()) {
      wheres.push(`\`${m[2]}\`='${m[3]}'`);
    }
  }
  if (!wheres.length) {
    return res.status(400).json({ message: '未检测到有效条件' });
  }
  
  db.query(`DESCRIBE \`${table}\``, (err, results) => {
    if (err) return res.status(500).json({ message: '表结构校验失败', error: err });
    const col = results.find(col => col.Field === field);
    if (!col) return res.status(400).json({ message: `字段 ${field} 不存在` });
    const pk = (results.find(col => col.Key === 'PRI') || results[0]).Field; 
   
    const selectSql = `SELECT \`${pk}\`, \`${field}\` FROM \`${table}\` WHERE ${wheres.join(' AND ')}`;
    db.query(selectSql, (selectErr, selectRows) => {
      if (selectErr) return res.status(500).json({ message: '读取更新前数据失败', error: selectErr });
      const oldDetails = selectRows.map(r => ({id: r[pk], value: r[field]}));
      
      const sql = `UPDATE \`${table}\` SET \`${field}\`=? WHERE ${wheres.join(' AND ')}`;
      db.query(sql, [value], (err2, result) => {
        if (err2) return res.status(500).json({ message: '批量更新失败', error: err2 });
        
        const logSql = `INSERT INTO update_log (time, operator, \`condition\`, table_name, field, old_values, new_value, count, result) VALUES (NOW(),?,?,?,?,?,?,?,?)`;
        db.query(logSql, [operator || '管理员', condition, table, field, JSON.stringify(oldDetails), value, result.affectedRows, '成功'], (logErr) => {
          if (logErr) return res.status(500).json({ message: '批量更新成功但日志入库失败', error: logErr });
          res.json({
            message: '批量更新成功',
            affectedRows: result.affectedRows,
            old_values: oldDetails,
            time: new Date(),
            operator: operator || '管理员',
          });
        });
      });
    });
  });
};

/**
 * 诊疗记录-主治医生就诊量Top5
 */
exports.getDoctorTop5 = (req, res) => {
  const sql = `SELECT \`主治医生\` AS doctor, COUNT(*) AS cnt FROM \`诊疗记录\` GROUP BY \`主治医生\` ORDER BY cnt DESC LIMIT 5`;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: '查询Top5失败', error: err });
    const doctors = rows.map(r => r.doctor || '未知');
    const counts = rows.map(r => r.cnt || 0);
    res.json({ doctors, counts, rows });
  });
};