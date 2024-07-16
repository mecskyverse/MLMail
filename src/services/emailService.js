const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const { MongoClient } = require('mongodb');
const config = require('../config/config');
const moment = require('moment'); 
const fetchEmails = async () => {
    const connection = await imap.connect({ imap: config.imap });
    await connection.openBox('INBOX');
    console.log(config.imap)

  const oneMonthAgo = moment().subtract(1, 'day').toDate();


    const searchCriteria = ['ALL', ['SINCE', oneMonthAgo]];
  const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'], struct: true };
  const messages = await connection.search(searchCriteria, fetchOptions);
  console.log(messages)
  const emails = await Promise.all(messages.map(async (message) => {
    const parts = imap.getParts(message.attributes.struct);
    const part = parts.find(part => part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT');
    console.log('parts ', parts)
    const parsed = await simpleParser(message.parts[0].body);
    return {
      from: parsed.from.text,
      to: parsed.to.text,
      subject: parsed.subject,
      date: parsed.date,
      text: parsed.text,
    };
  }));
//   const client = new MongoClient(config.mongodbUri);
//   await client.connect();
//   const db = client.db();
//   await db.collection('emails').insertMany(emails);

//   await connection.end();
//   await client.close();
};

module.exports = { fetchEmails };
