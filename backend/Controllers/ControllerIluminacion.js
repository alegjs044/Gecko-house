const db = require('../db');

exports.addLuzUV = (req, res) => {
    const { ID_usuario, Medicion, Marca_tiempo } = req.body;
    if (!ID_usuario || !Medicion || !Marca_tiempo) {
        return res.status(400).json({ error: 'El valor de luz uv es requerido' });
    }

    const query = 'INSERT INTO luz_uv (ID_usuario, Medicion, Marca_tiempo) VALUES (?, ?, ?)';
    db.query(query, [ID_usuario, Medicion, Marca_tiempo], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Luz uv guardada', id: result.insertId });
    });
};

exports.getLuzUV = (req, res) => {
    db.query('SELECT Medicion, Marca_tiempo FROM luz_uv', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};

exports.deleteLuzUV = (req, res) => {
    const { ID_luz_uv } = req.params;
    db.query('DELETE FROM luz_uv WHERE ID_luz_uv = ?', [ID_luz_uv], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Luz uv eliminada' });
    });
};