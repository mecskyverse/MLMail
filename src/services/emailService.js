const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const { MongoClient } = require('mongodb');
const config = require('../config/config');
const moment = require('moment'); 
const fs = require('fs').promises;
// pyncorn
const fetchEmails = async () => {
    try {
        const connection = await imap.connect({ imap: config.imap });
        await connection.openBox('INBOX');

        const delay = 24 * 3600 * 1000;
        let yesterday = new Date();
        yesterday.setTime(Date.now() - delay);
        yesterday = yesterday.toISOString();

        const searchCriteria = ['UNSEEN', ['SINCE', yesterday]];
        const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'], struct: true };

        const messages = await connection.search(searchCriteria, fetchOptions);
        
        const emails = await Promise.all(messages.map(async (message) => {
            const allParts = imap.getParts(message.attributes.struct);
            const bodyPart = message.parts.find(part => part.which === 'TEXT');
            const parsed = await simpleParser(bodyPart.body);
            // console.log('parsed' , parsed.text)
            

            return {
          
                subject: parsed.text,
              
            };
        }));
                 // Save emails to a JSON file
                 const filePath = './emails.json';
                 await fs.writeFile(filePath, JSON.stringify(emails, null, 2));
                 console.log('Emails saved to file:', filePath);
        

        // Uncomment the following lines to save emails to MongoDB
        // const client = new MongoClient(config.mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true });
        // await client.connect();
        // const db = client.db();
        // await db.collection('emails').insertMany(emails);
        // await client.close();

        await connection.end();

        console.log('Emails fetched and processed successfully:', emails);
    } catch (error) {
        console.error('Error fetching emails:', error);
    }
};

module.exports = { fetchEmails };
