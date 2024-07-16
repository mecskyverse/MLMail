const { fetchEmails: fetchEmailsService } = require('../services/emailService');
// const { searchEmails: searchEmailsService } = require('../services/searchService');

const fetchEmails = async (req, res) => {
  try {
    await fetchEmailsService();
    res.status(200).send('Emails fetched and stored successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// const searchEmails = async (req, res) => {
//   try {
//     const { query } = req.body;
//     const results = await searchEmailsService(query);
//     res.status(200).json(results);
//   } catch (error) {
//     res.status(500).send(error.message);
//   }
// };

module.exports = { fetchEmails };
