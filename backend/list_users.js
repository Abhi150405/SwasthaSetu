import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';

dotenv.config();

const listUsers = async () => {
    try {
        const uri = `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;
        await mongoose.connect(uri);

        const users = await User.find({}, 'name email role').lean();

        console.log(`__COUNT__${users.length}__`);
        users.forEach(u => {
            console.log(`__USER__${u.name}||${u.email}||${u.role}__`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("ERROR:", error.message);
    }
};

listUsers();
