import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

export const DB_URI = process.env.DB_URI;
export const PORT = process.env.PORT || 8000;
export const SECRET_KEY = process.env.SECRET_KEY;


export const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, 
        });
        console.log('Conectado a MongoDB');
    } catch (err) {
        console.error('Error conectando a MongoDB:', err);
    }
};


