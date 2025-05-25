const validator = {
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    validateDateTime: (dateTime) => {
        const date = new Date(dateTime);
        return !isNaN(date.getTime());
    },
}

module.exports = validator;