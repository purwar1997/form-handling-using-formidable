const express = require('express');
const formidable = require('formidable');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const client = require('./config/s3.config');
const config = require('./config/config');

const {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');

const app = express();

app.set('view-engine', 'ejs');
app.use(express.json());

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

      if (!fields || Object.keys(fields).length === 0) {
        throw new Error('Fields not provided');
      }

      const { name, email, password } = fields;

      if (!(name && email && password)) {
        throw new Error('Please provide all the details');
      }

      if (!files || Object.keys(files).length === 0) {
        throw new Error('Files not uploaded');
      }

      let { profilePhotos } = files;

      if (!Array.isArray(profilePhotos)) {
        profilePhotos = [profilePhotos];
      }

      profilePhotos.forEach(async ({ filepath, mimetype }) => {
        const data = fs.readFileSync(filepath);

        const command = new PutObjectCommand({
          Bucket: config.S3_BUCKET,
          Key: uuidv4(),
          Body: data,
          ContentType: mimetype,
        });

        await client.send(command);
      });

      res.status(201).json({
        success: true,
        message: 'Files successfully uploaded',
        data: {
          name,
          email,
          password,
        },
      });
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.get('/api/fetch/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Please provide an id');
    }

    const command = new GetObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: id,
    });

    const response = await client.send(command);

    res.status(200).json({
      success: true,
      message: 'File successfully fetched',
      response,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.get('/api/fetch', async (_req, res) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: config.S3_BUCKET,
    });

    const response = await client.send(command);

    res.status(200).json({
      success: true,
      message: 'Files successfully fetched',
      response,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.delete('/api/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error('Please provide an id');
    }

    const command = new DeleteObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: id,
    });

    const response = await client.send(command);

    res.status(200).json({
      success: true,
      message: 'File successfully deleted',
      response,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.delete('/api/delete', async (req, res) => {
  try {
    let { keys } = req.query;

    keys = keys.map(key => {
      return { Key: key };
    });

    const command = new DeleteObjectsCommand({
      Bucket: config.S3_BUCKET,
      Delete: {
        Objects: keys,
      },
    });

    const response = await client.send(command);

    res.status(200).json({
      success: true,
      message: 'Files successfully deleted',
      response,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.listen(config.PORT, () => console.log(`Server is running on http://localhost:${config.PORT}`));
