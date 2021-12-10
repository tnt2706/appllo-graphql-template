module.exports = {
  cognito: {
    region: process.env.COGNITO_REGION,
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
    cognitoRoleArn: process.env.COGNITO_ROLE_ARN,
    clientId: process.env.COGNITO_APP_CLIENT_ID_WEB,

    temporaryPassword: process.env.COGNITO_USER_TEMP_PASSWORD,
  },
  s3: {
    region: process.env.AWS_REGION || 'us-east-2',

    uploadBucket: process.env.S3_UPLOAD_BUCKET,
    uploadBucketExpires: parseInt(process.env.COGNITO_UPLOAD_TOKEN_DURATION || '120', 10),

    pdfBucket: process.env.S3_REPORT_BUCKET || 'btcy-report-alpha',
    pdfExpires: parseInt(process.env.COGNITO_PDF_TOKEN_DURATION || '60', 10),

    userBucket: process.env.S3_USER_BUCKET,
    userBucketExpires: parseInt(process.env.USER_FILE_TOKEN_DURATION || '120', 10),

    frequentlyAccessBucket: process.env.S3_FREQUENTLY_ACCESS_BUCKET,
    frequentlyAccessExpires: parseInt(process.env.COGNITO_PDF_TOKEN_DURATION || '60', 10),

  },
  pinpoint: {
    region: process.env.PINPOINT_REGION,
    applicationId: process.env.PINPOINT_APP_ID,
  },

  ses: {
    region: process.env.SES_REGION || 'us-east-1',
    fromName: process.env.SES_INVITE_FROM_NAME || 'Biocare cardiac',
    fromEmail: process.env.SES_INVITE_FROM_EMAIL || 'noreply@biotricity.com',
  },
};
