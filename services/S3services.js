const AWS = require('aws-sdk');

const uploadToS3 = async (data, filename) => {
    const BUCKET_NAME = process.env.BUCKET_NAME;
    const IAM_USER_KEY = process.env.IAM_USER_KEY;
    const IAM_USER_SECRET_KEY = process.env.IAM_USER_SECRET_KEY;

    const s3 = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET_KEY,
    });

    const params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: data,
        ACL: 'public-read'
    };

    return new Promise((resolve, reject) => {
        s3.upload(params, (err, s3Response) => {
            if (err) {
                console.error("Error uploading to S3:", err);
                reject(err);
            } else {
                console.log("File uploaded successfully:", s3Response.Location);
                resolve(s3Response.Location);
            }
        });
    });
}

module.exports = { uploadToS3 }; 