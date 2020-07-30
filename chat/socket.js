const IO = require('socket.io');
const Joi = require('@hapi/joi');
const { query } = require('../mysql');

const insertMessage = (value) => {
    return query({
        sql: 'INSERT INTO messages SET ?',
        values: value
    }).then(result => {
        if (result.insertId && result.affectedRows) {
            return query({
                sql: 'SELECT * FROM messages WHERE id = ?',
                values: result.insertId
            }, true);
        } else {
            return Promise.resolve(null);
        }
    })
};

const insertConversation = (value) => {
    return query({
        sql: 'INSERT INTO conversations SET ?',
        values: value
    }).then(result => {
        if (result.insertId && result.affectedRows) {
            return query({
                sql: 'SELECT * FROM conversations WHERE id = ?',
                values: result.insertId
            }, true);
        } else {
            return Promise.resolve(null);
        }
    })
};

const io = IO();

io.use((socket, next) => {
    let userId = socket.handshake.headers['user_id'];
    socket.userId = userId;
    return next();
});
  
io.on('connection', (socket) => {
    socket.join(`user-room-${socket.userId}`);

    socket.on('send-message', async (data) => {
        const schema = Joi.object().keys({
            receiver_id: Joi.number().integer().min(1).required(),
            type: Joi.string().valid('TEXT', 'IMAGE', 'VIDEO', 'FILE').required(),
            body: Joi.string().max(1000).required()
        });

        const { value, error } = schema.validate(data);
        
        let sender_id = socket.userId;

        if (error) return;

        try {
            let conversation = await query({
                sql: 'SELECT * FROM conversations WHERE (p1 = ? AND p2 = ?) OR (p1 = ? AND p2 = ?)',
                values: [sender_id, value.receiver_id, value.receiver_id, sender_id]
            }, true);

            if (!conversation) {
                conversation = await insertConversation({
                    p1: sender_id,
                    p2: value.receiver_id
                });
            };

            if (!conversation) return;

            const message = await insertMessage({
                sender_id: sender_id,
                type: value.type,
                body: value.body,
                conversation_id: conversation.id
            });

            if (!message) return;

            conversation.message = message;

            socket.to(`user-room-${value.receiver_id}`).emit('new-message', conversation);

        } catch (error) {
            console.log(error);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log('disconnect');
    });
});

module.exports = io;