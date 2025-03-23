const db = require('../db');

exports.addTemperatura = (req, res) => {
    const { ID_usuario, Medicion, Zona, Marca_tiempo } = req.body;
    if (!ID_usuario || !Medicion || !Zona || !Marca_tiempo) {
        return res.status(400).json({ error: 'El valor de temperatura es requerido' });
    }

    const query = 'INSERT INTO temperatura (ID_Usuario, Medicion, Zona, Marca_Tiempo) VALUES (?, ?, ?, ?)';
    db.query(query, [ID_usuario, Medicion, Zona, Marca_tiempo], (err, result) => {
        if (err) {
            console.log('El insert no se realizo correctamente :-(')
            return res.status(500).json({ error: err.message});
        }
        res.status(201).json({ message: 'Temperatura guardada', id: result.insertId });
    });
};

// Corregido para incluir el parámetro req
exports.getTemperatura = (req, res) => {
    db.query('SELECT Medicion, Zona, Marca_tiempo FROM temperatura ORDER BY Marca_tiempo DESC', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};

exports.deleteTemperatura = (req, res) => {
    const { ID_temperatura } = req.params;
    db.query('DELETE FROM temperatura WHERE ID_temperatura = ?', [ID_temperatura], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Temperatura eliminada' });
    });
};