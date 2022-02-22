const eventTypes = {
    im: 'im',
}

const eventSubtypes = {
    post: 'post',
    deletion: 'deletion'
}

const chatMessageType = {
    NORMAL: 'NORMAL', 
    ANNOUNCEMENT: 'ANNOUNCEMENT', 
    PINNED: 'PINNED'
}



function generateChatMessage(message_id, created_at) {
        return {
            type: eventTypes.im,
            subtype: eventSubtypes.post,
            content: {
                message_id: `${message_id}`,
                author: {
                    uuid: '1_user',
                    name: 'Test'
                },
                from_server: true,
                stream: '1',
                text: `Text message ${message_id}`,
                message_local_id: `${message_id}`,
                type: chatMessageType.NORMAL,
                created_at: created_at ? created_at : new Date()
            },
        }
}

module.exports = {
    generateChatMessage
}