/**
 * Configuration de la connexion MongoDB
 * Gère la connexion à la base de données et la fermeture propre
 * @module DatabaseConfig
 */
const mongoose = require('mongoose');

/**
 * Établit la connexion à MongoDB
 * @async
 * @throws {Error} Si la connexion échoue ou si MONGODB_URI n'est pas défini
 */
const connectDB = async () => {
  try {
    // Récupération de l'URI MongoDB depuis les variables d'environnement
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    // Vérification que l'URI est définie
    if (!mongoUri) {
      throw new Error('MONGODB_URI is undefined. Check your .env file');
    }

    // Connexion à MongoDB avec Mongoose
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    /**
     * Gestion de la fermeture propre de la connexion
     * En cas d'arrêt de l'application (SIGINT), ferme la connexion MongoDB
     */
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    // Gestion des erreurs de connexion
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
