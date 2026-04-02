const db = require('../config/db');

const Inventory = {
  list: async () => {
    const [rows] = await db.query('SELECT * FROM mds_inventory ORDER BY name ASC');
    return rows;
  },
  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM mds_inventory WHERE id = ?', [id]);
    return rows[0];
  },
  create: async (data) => {
    const [result] = await db.query(
      'INSERT INTO mds_inventory (name, unit, stock, min_stock, price, supplier) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.unit, data.stock, data.min_stock, data.price, data.supplier]
    );
    return result.insertId;
  },
  update: async (id, data) => {
    await db.query(
      'UPDATE mds_inventory SET name=?, unit=?, stock=?, min_stock=?, price=?, supplier=? WHERE id=?',
      [data.name, data.unit, data.stock, data.min_stock, data.price, data.supplier, id]
    );
  },
  updateStock: async (id, delta) => {
    await db.query('UPDATE mds_inventory SET stock = stock + ? WHERE id = ?', [delta, id]);
  },
  delete: async (id) => {
    await db.query('DELETE FROM mds_inventory WHERE id = ?', [id]);
  }
};

module.exports = Inventory;
