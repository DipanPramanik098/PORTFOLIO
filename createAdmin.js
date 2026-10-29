require('dotenv').config();
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

(async () => {
    const rl = readline.createInterface({ input, output });
    try {
        await mongoose.connect(process.env.MONGO_URI);

        if ((await Admin.countDocuments()) > 0) {
            console.log('An admin already exists. Log in and add more admins from /admin/admins.');
            return;
        }

        const email = (await rl.question('Admin email: ')).trim().toLowerCase();
        if (!/^[^\s@,<>;]+@[^\s@,<>;]+\.[^\s@,<>;]+$/.test(email)) {
            console.log('That is not a valid email address.');
            return;
        }

        const password = await rl.question('Password (8 to 72 characters): ');
        if (password.length < 8 || password.length > 72) {
            console.log('Password must be 8 to 72 characters.');
            return;
        }

        await Admin.create({ email, password });
        console.log('First admin created. You can log in at /admin/login');
    } catch (err) {
        console.error(err.message);
    } finally {
        rl.close();
        await mongoose.disconnect();
    }
})();