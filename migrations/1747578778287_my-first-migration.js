exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    username: { type: 'varchar(100)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });

  pgm.createTable('groups', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });

  pgm.createTable('messages', {
    id: 'id',
    chat_room_id: {
      type: 'integer',
      references: 'groups(id)',
      onDelete: 'CASCADE',
    },
    sender_id: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    content: { type: 'text', notNull: true },
    sent_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });

  pgm.createTable('chat_room_members', {
    id: 'id',
    chat_room_id: {
      type: 'integer',
      references: 'groups(id)',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    joined_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
  pgm.addConstraint(
    'chat_room_members',
    'unique_chat_room_user',
    'UNIQUE(chat_room_id, user_id)'
  );

  pgm.createTable('schedules', {
    id: 'id',
    user_id: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    start_time: { type: 'timestamp', notNull: true },
    end_time: { type: 'timestamp', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('schedules');
  pgm.dropConstraint('chat_room_members', 'unique_chat_room_user');
  pgm.dropTable('chat_room_members');
  pgm.dropTable('messages');
  pgm.dropTable('groups');
  pgm.dropTable('users');
};
