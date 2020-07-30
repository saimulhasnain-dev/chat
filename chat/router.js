const express = require('express');
const { query } = require('../mysql');
const router = express.Router();

router.get('/users', (req, res) => {
    query({
        sql: 'SELECT * FROM users'
    })
    .then(data => res.json(data))
    .catch(err => res.status(500).json(err))
});

router.get('/conversations', (req, res) => {
    const loginUserId = 1;

    query({
        sql: `
        SELECT conversations.*, users.name as receiver_name
        FROM conversations
        JOIN users ON users.id = (CASE WHEN p1 = ? THEN conversations.p2 ELSE conversations.p1 END)
        WHERE conversations.p1 = ? OR conversations.p2 = ?
        `,
        values: [loginUserId, loginUserId, loginUserId]
    })
    .then(data => res.json(data))
    .catch(err => res.status(500).json(err))
});

router.get('/conversations/:id/messages', (req, res) => {
    const loginUserId = 1;

    let sql = `SELECT messages.*
    FROM messages
    WHERE conversation_id = ?
    `;

    const values = [req.params.id];

    if (req.query.from_id) {
        sql += ' AND messages.id < ? ';
        values.push(req.query.from_id)
    }

    sql += 'ORDER BY created_at DESC LIMIT 10';

    query({
        sql: sql,
        values: values
    })
    .then(data => res.json(data))
    .catch(err => res.status(500).json(err))
});

module.exports = router;