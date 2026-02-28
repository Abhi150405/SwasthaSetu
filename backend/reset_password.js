import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';

dotenv.config();

const resetPassword = async () => {
    try {
        const uri = `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;
        await mongoose.connect(uri);

        const email = 'you@gmail.com';
        const newPassword = 'password123';

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`USER_NOT_FOUND: ${email}`);
        } else {
            user.password = newPassword;
            await user.save();
            console.log(`PASSWORD_RESET_SUCCESS: ${email} to ${newPassword}`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("ERROR:", error.message);
    }
};

resetPassword();
