const { MongoClient } = require('mongodb');
const { generateEmbeddings } = require('./aiService');
const config = require('../config/config');

const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
};

const searchEmails = async (query) => {
  const client = new MongoClient(config.mongodbUri);
  await client.connect();
  const db = client.db();

  const queryEmbeddings = await generateEmbeddings(query);
  const emails = await db.collection('emails').find().toArray();

  const results = emails.map(email => {
    const emailEmbeddings = email.embeddings;
    const similarity = cosineSimilarity(queryEmbeddings, emailEmbeddings);
    return { ...email, similarity };
  }).sort((a, b) => b.similarity - a.similarity);

  await client.close();
  return results;
};

module.exports = { searchEmails };
