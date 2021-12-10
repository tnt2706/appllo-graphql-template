const _ = require('lodash');
const path = require('path');
const Aws = require('aws-sdk');
// const { parseURL } = require('whatwg-url');
const { parse } = require('url');
const mimeTypes = require('mime-types');
const config = require('../../../config');

function extractSignedUrl(url) {
  const uri = parse(url);
  uri.pathname = decodeURIComponent(uri.pathname || '');
  const s3Style = (uri.protocol === 's3:') ? 's3'
    : (/^s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/.test(uri.hostname)) ? 'bucket-in-path'
      : (/\.s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/.test(uri.hostname)) ? 'bucket-in-host' : '';

  if (s3Style === 's3') {
    return {
      bucket: uri.hostname,
      key: uri.pathname.slice(1),
    };
  }
  if (s3Style === 'bucket-in-path') {
    return {
      bucket: uri.pathname.split('/')[1],
      key: uri.pathname.split('/').slice(2).join('/'),
    };
  }
  if (s3Style === 'bucket-in-host') {
    const match = uri.hostname.replace(/\.s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com(\.cn)?/, '');
    return {
      bucket: match.length ? match : uri.hostname.split('.')[0],
      key: uri.pathname.slice(1),
    };
  }

  return {};
}

function getS3SignedUrl(bucket, key, output, expires) {
  const s3 = new Aws.S3({ region: config.s3.region, signatureVersion: 'v4' });
  const s3Params = {
    Bucket: bucket,
    Key: key,
    Expires: expires,
    ResponseContentDisposition: output ? `attachment; filename="${output}"` : undefined,
  };

  return s3.getSignedUrlPromise('getObject', s3Params);
}

function getS3SignedUrls(bucket, files, expires) {
  const s3 = new Aws.S3({ region: config.s3.region, signatureVersion: 'v4' });
  const promises = _.map(files, (file) => {
    const { fileName, output } = file;
    const s3Params = {
      Bucket: bucket,
      Key: fileName,
      Expires: expires,
      ResponseContentDisposition: output ? `attachment; filename="${output}"` : undefined,
    };
    return s3.getSignedUrlPromise('getObject', s3Params);
  });
  return Promise.all(promises);
}

async function getS3Url({ bucket, fileName, output, expires }) {
  const url = await getS3SignedUrl(bucket, fileName, output, expires);
  return url;
}

async function getS3Urls({ bucket, files, expires }) {
  if (!files?.length) {
    return [];
  }

  const urls = await getS3SignedUrls(bucket, files, expires);
  return urls;
}

async function copyS3File(url, destination, tags, willDeleteSource = true) {
  const sourceMeta = extractSignedUrl(url);
  const extension = path.extname(sourceMeta.key);
  const { bucket, filename } = destination;
  const s3 = new Aws.S3({ region: config.s3.region, signatureVersion: 'v4' });
  const contentType = getContentType(extension);
  await s3.copyObject({
    Bucket: bucket,
    Key: `${filename}${extension}`,
    CopySource: `${sourceMeta.bucket}/${sourceMeta.key}`,
    Tagging: _.map(tags, (value, key) => `${key}=${value}`).join('&'),
    TaggingDirective: 'REPLACE',
    ContentType: contentType,
    MetadataDirective: 'REPLACE',
  }).promise();
  if (willDeleteSource) {
    await s3.deleteObject({
      Bucket: sourceMeta.bucket,
      Key: sourceMeta.key,
    }).promise();
  }
  return `${filename}${extension}`;
}

async function clearS3Folder(bucket, directory) {
  const s3 = new Aws.S3({ region: config.s3.region, signatureVersion: 'v4' });
  const listObjectsResponse = await s3.listObjects({
    Bucket: bucket,
    Prefix: directory,
  }).promise();
  const folderContentInfo = listObjectsResponse.Contents;
  await Promise.all(
    folderContentInfo.map(async (fileInfo) => {
      await s3.deleteObject({
        Bucket: bucket,
        Key: fileInfo.Key,
      }).promise();
    }),
  );
}

async function getObject({ bucket, key }) {
  const s3 = new Aws.S3({ region: config.s3.region, signatureVersion: 'v4' });
  return s3.getObject({
    Bucket: bucket,
    Key: key,
  }).promise();
}

function getContentType(extension) {
  let contentType = mimeTypes.lookup(extension);
  switch (extension) {
    case '.jfif': contentType = 'image/jpeg';
      break;
    default:
      break;
  }
  return contentType;
}

/**
 *
 * @param {*} source: sourceBucket, sourceKey
 * @param {*} destination: destinationBucket,destinationKey
 * @param {*} tags
 */
async function copyS3FileBiofuxReport(source, destination, tags) {
  const { bucket: sourceBucket, key: sourceKey } = source;
  const { bucket: destinationBucket, key: destinationKey } = destination;
  const s3 = new Aws.S3({ region: config.s3.region, signatureVersion: 'v4' });
  const extension = path.extname(sourceKey);
  const contentType = getContentType(extension);
  await s3.copyObject({
    Bucket: destinationBucket,
    Key: `${destinationKey}${extension}`,
    CopySource: `${sourceBucket}/${sourceKey}`,
    Tagging: _.map(tags, (value, key) => `${key}=${value}`).join('&'),
    TaggingDirective: 'REPLACE',
    ContentType: contentType,
    MetadataDirective: 'REPLACE',
  }).promise();
  return `${destinationKey}${extension}`;
}

module.exports = {
  extractSignedUrl,
  getS3Url,
  getS3Urls,
  copyS3File,
  clearS3Folder,
  getObject,
  copyS3FileBiofuxReport,
};
