const db = require('../db');

exports.addHumedad = (req, res) => {
    const { ID_usuario, Medicion, Marca_tiempo } = req.body;
    if (!ID_usuario || !Medicion || !Marca_tiempo) {
        return res.status(400).json({ error: 'El valor de humedad es requerido' });
    }

    const query = 'INSERT INTO humedad (ID_usuario, Medicion, Marca_tiempo) VALUES (?, ?, ?)';
    db.query(query, [ID_usuario, Medicion, Marca_tiempo], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Humedad guardada', id: result.insertId });
    });
};

exports.getHumedad = (res) => {
    db.query('SELECT Medicion, Marca_tiempo FROM humedad', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};

exports.deleteHumedad = (req, res) => {
    const { ID_humedad } = req.params;
    db.query('DELETE FROM humedad WHERE ID_humedad = ?', [ID_humedad], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Humedad eliminada' });
    });
};