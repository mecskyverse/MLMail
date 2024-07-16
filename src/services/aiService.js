const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');

let model;

const loadModel = async () => {
  model = await use.load();
};

const generateEmbeddings = async (text) => {
  const embeddings = await model.embed([text]);
  return embeddings.arraySync()[0];
};

module.exports = { loadModel, generateEmbeddings };
