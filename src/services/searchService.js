// const { generateEmbeddings } = require('./aiService');
const config = require('../config/config');
const {
  VectorStoreIndex,
  PineconeVectorStore,
  serviceContextFromDefaults
} = require("llamaindex");
const { Pinecone } =  require('@pinecone-database/pinecone');
const OpenAI = require("openai");

const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const searchEmails = async (query = 'Who is Amanda') => {
  try {
    const index = pc.index('text-embedding-3-small');

  const indexOutput = await index.describeIndexStats()
  const serviceContext = serviceContextFromDefaults();
  let vector_store = new PineconeVectorStore()
  let vector_index = await VectorStoreIndex.fromVectorStore(vector_store)
  // let retriever = new VectorIndexRetriever({index: vector_index, similarityTopK: 5, serviceContext})
  // const answer = await retriever.retrieve({query: 'Who is Aakash'})
  // console.log(answer)

  const queryEngine = await vector_index.asQueryEngine()
  const llmQuery = await queryEngine.query({query : query})
  console.log(llmQuery.message)

  // Output response with sources
  // console.log(response);
  } catch (error) {
    console.error(error)
  }
}

searchEmails()

module.exports = { searchEmails };
