const express = require('express');
const formidable = require('formidable');
const config = require('./config/config');

const app = express();

app.set('view-engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api', (_req, res) => {
  res.status(200).render('form.ejs');
});

app.post('/api/upload', (req, res) => {
  try {
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      uploadDir: __dirname + '/uploads',
      allowEmptyFiles: false,
      maxFiles: 5,
      maxTotalFileSize: 10 * 1024 * 1024,
      filter: ({ mimetype }) => mimetype && mimetype.includes('image'),
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        throw new Error('Error parsing form data');
      }

      console.log(fields, files);

      if (!fields || Object.keys(fields).length === 0) {
        throw new Error('Fields not passed');
      }

      const { name, email, password } = fields;

      if (!(name && email && password)) {
        throw new Error('Please provide all the details');
      }

      if (!files || Object.keys(files).length === 0) {
        throw new Error('Files not uploaded');
      }

      res.status(200).json({
        name,
        email,
        password,
        files,
      });
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.listen(config.PORT, () => console.log(`Server is running on http://localhost:${config.PORT}`));
