const db = require('../db');

// Agregar una nueva notificación
exports.addNotification = (req, res) => {
    const { tipo, descripcion, time_alert} = req.body;

    if (!tipo || !descripcion || !time_alert) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const query = "INSERT INTO notificacion (tipo, descripcion, time_alert) VALUES (?, ?, ?)";
    db.query(query, [tipo, descripcion, time_alert], (err, result) => {
        if (err) {
            console.error('Error al insertar notificación:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Notificación guardada', id_notificacion: result.insertId });
    });
};

// Agregar relación entre notificación y usuario
exports.addNotificationUser = (req, res) => {
    const { id_notificacion, id_user } = req.body;

    if (!id_notificacion || !id_user) {
        return res.status(400).json({ error: 'ID de notificación y usuario son requeridos' });
    }

    const query = 'INSERT INTO notificacion_user (id_notificacion, id_user, is_read) VALUES (?, ?, ?)';
    db.query(query, [id_notificacion, id_user, 0], (err) => { // 0 es equivalente a false en MySQL
        if (err) {
            console.error('Error al insertar en notificacion_user:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Relación notificación-usuario guardada con read como false' });
    });
};

// Obtener notificaciones de un usuario por su ID
exports.getNotificationsByUserId = (req, res) => {
    const { id_user } = req.params; // Obtener el ID del usuario desde los parámetros

    if (!id_user) {
        return res.status(400).json({ error: 'El ID de usuario es requerido' });
    }

    // Consulta SQL que obtiene el tipo, descripcion, time_alert y el estado de lectura
    const query = `
        SELECT n.id_notificacion, n.tipo, n.descripcion, n.time_alert, nu.is_read
        FROM notificacion n
        JOIN notificacion_user nu ON n.id_notificacion = nu.id_notificacion
        WHERE nu.id_user = ?
        ORDER BY n.time_alert DESC;
    `;


    db.query(query, [id_user], (err, results) => {
        if (err) {
            console.error('Error al obtener notificaciones:', err);
            return res.status(500).json({ error: err.message });
        }

        // Verificar si se encontraron resultados
        if (results.length === 0) {
            return res.status(404).json({ message: 'No se encontraron notificaciones para este usuario' });
        }

        res.status(200).json({ notifications: results });
    });
};

// Marcar una notificación específica como leída
exports.markNotificationAsRead = (req, res) => {
    const { id_notificacion, id_user } = req.params;

    if (!id_notificacion || !id_user) {
        return res.status(400).json({ error: 'ID de notificación y usuario son requeridos' });
    }

    const query = 'UPDATE notificacion_user SET is_read = 1 WHERE id_notificacion = ? AND id_user = ?';
    db.query(query, [id_notificacion, id_user], (err, result) => {
        if (err) {
            console.error('Error al marcar la notificación como leída:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No se encontró la relación notificación-usuario' });
        }
        
        res.status(200).json({ message: 'Notificación marcada como leída' });
    });
};

// Marcar todas las notificaciones de un usuario como leídas
exports.markAllNotificationsAsRead = (req, res) => {
    const { id_user } = req.params;

    if (!id_user) {
        return res.status(400).json({ error: 'ID de usuario es requerido' });
    }

    const query = 'UPDATE notificacion_user SET is_read = 1 WHERE id_user = ? AND is_read = 0';
    db.query(query, [id_user], (err, result) => {
        if (err) {
            console.error('Error al marcar todas las notificaciones como leídas:', err);
            return res.status(500).json({ error: err.message });
        }
        
        res.status(200).json({ 
            message: 'Todas las notificaciones han sido marcadas como leídas',
            updatedCount: result.affectedRows
        });
    });
};