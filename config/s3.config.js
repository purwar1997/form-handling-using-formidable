const { S3Client } = require('@aws-sdk/client-s3');
const config = require('./config');

const client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = client;
