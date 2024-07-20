const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const { MongoClient } = require('mongodb');
const config = require('../config/config');
const moment = require('moment'); 
const fs = require('fs').promises;
const { htmlToText } = require('html-to-text');
const pdfParse = require('pdf-parse');
const OpenAI = require("openai");
const { Pinecone } =  require('@pinecone-database/pinecone');
const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});
const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});
const { get_encoding } = require('tiktoken');
// pyncorn
const fetchEmails = async () => {
    try {
        const connection = await imap.connect({ imap: config.imap });
        await connection.openBox('INBOX');
        const index = pc.index('text-embedding-3-small');

        const delay = 2 * 3600 * 1000;
        let yesterday = new Date();
        yesterday.setTime(Date.now() - delay);
        yesterday = yesterday.toISOString();

        const searchCriteria = [['SINCE', yesterday]];
        const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'], struct: true };

        const messages = await connection.search(searchCriteria, fetchOptions);
        
        const emails = await Promise.all(messages.map(async (message) => {
            const allParts = imap.getParts(message.attributes.struct);
            const bodyPart = message.parts.find(part => part.which === 'TEXT');
            const parsed = await simpleParser(bodyPart.body);
            let textContent = htmlToText(parsed.html || parsed.text || '');
        
            // Remove URLs and their descriptions in square brackets
            textContent = textContent.replace(/\[http[^\]]*\]/g, '');
            // Remove newline characters
            textContent = textContent.replace(/\n/g, '');

            // Remove lines containing URLs starting with http:// or https://
            textContent = textContent.replace(/https?:\/\/\S+/g, '');
           
            let subjectEmbedding
             try {
                const encoding = await get_encoding('cl100k_base');
                const numTokens = encoding.encode(textContent).length;
                console.log(numTokens);
                // Converting email subject into embedding
                if(numTokens< 8000){
                    const subjectEmbeddingResponse = await openai.embeddings.create({
                        model: "text-embedding-3-small",
                        input: textContent,
                    });
                    subjectEmbedding = subjectEmbeddingResponse.data[0].embedding;
                }
             } catch (error) {
                console.error(error)
             }
            //  console.log('subject ', subjectEmbedding)
            const attachments = await Promise.all(allParts
                .filter(part => part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT')
                .map(async (part) => {
                    const partData = await connection.getPartData(message, part);
                    const attachment = {
                        filename: part.disposition.params.filename,
                        data: partData
                    };
                    
                    // Save attachment to file
                    const filePath = `./attachments/${attachment.filename}`;
                    await fs.writeFile(filePath, attachment.data);
                    console.log('done writing file')

                    // Extract text from PDF if applicable
                    if (attachment.filename.endsWith('.pdf')) {
                        const pdfBuffer = await fs.readFile(filePath);
                        const pdfData = await pdfParse(pdfBuffer);
                        const pdfText = pdfData.text;
                        
                        // Clean the extracted text from the PDF
                        let cleanedText = pdfText.replace(/\[http[^\]]*\]/g, '');
                        cleanedText = cleanedText.replace(/\n/g, '');
                        cleanedText = cleanedText.replace(/https?:\/\/\S+/g, '');
                        
                        // Converting attachment text into embedding
                        const embeddingResponse = await openai.embeddings.create({
                            model: "text-embedding-3-small",
                            input: cleanedText,
                            encoding_format: "float",
                        });
                        const attachmentEmbedding = embeddingResponse.data[0].embedding;

                        await index.namespace('attachment').upsert([
                            {
                                id: `${message.attributes.uid}-${attachment.filename}`,
                                values: attachmentEmbedding,
                                metadata: {
                                    subject: textContent,
                                    filename: attachment.filename
                                }
                            }
                        ]);

                        return {
                            filename: attachment.filename,
                            embedding: attachmentEmbedding
                        };
                    }
        console.log('returning attachmetn')
                    
                    return attachment;
                })
            );

           if(subjectEmbedding instanceof Array){
            console.log('inserting to database')
            await index.namespace('email').upsert([
                {
                    id: `${message.attributes.uid}-subject`,
                    values: subjectEmbedding,
                }
            ]);
           }

            return {
                subject: textContent,
                subjectEmbedding: subjectEmbedding,
                attachment: attachments
            };
        }));
                //  Save emails to a JSON file
                 const filePath = './emails.json';
                 await fs.writeFile(filePath, JSON.stringify(emails, null, 2));
                 console.log('Emails saved to file:', filePath);
     
              
        console.log('done')
        await connection.end();

    } catch (error) {
        console.error('Error fetching emails:', error);
    }
};

// tryInserting()
// fetchEmails()
const tryInserting = async () => {
    const index = pc.index('text-embedding-3-small');

    await index.namespace('ns1').upsert([
        {
           id: 'vec1', 
           values: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
           metadata: { genre: 'drama' }
        },
        {
           id: 'vec2', 
           values: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
           metadata: { genre: 'action' }
        },
        {
           id: 'vec3', 
           values: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
           metadata: { genre: 'drama' }
        },
        {
           id: 'vec4', 
           values: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
           metadata: { genre: 'action' }
        }
      ]);
}

module.exports = { fetchEmails };
