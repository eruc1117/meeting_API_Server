exports.up = (pgm) => {
    pgm.addColumns('schedules', {
        location: {
            type: 'varchar(255)',
            notNull: false,
        },
        participants: {
            type: 'text',
            notNull: false,
        },
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('schedules', ['location', 'participants']);
};
