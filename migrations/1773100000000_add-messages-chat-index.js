/**
 * Migration: messages 表複合索引
 * 目的：加速特定群組的歷史訊息讀取（chat_room_id + sent_at）
 */

exports.up = (pgm) => {
  pgm.createIndex('messages', ['chat_room_id', 'sent_at'], {
    name: 'idx_messages_chat_room_sent_at',
    ifNotExists: true,
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('messages', ['chat_room_id', 'sent_at'], {
    name: 'idx_messages_chat_room_sent_at',
    ifExists: true,
  });
};
