import mongoose from 'mongoose';

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