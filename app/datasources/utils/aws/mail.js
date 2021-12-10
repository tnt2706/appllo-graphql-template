const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const config = require('../../../config');

const ses = new AWS.SES({
  region: config.ses.region,
});

const transporter = nodemailer.createTransport({
  SES: ses,
});

async function loadTemplate(name, context = {}) {
  const templatePath = path.join(__dirname, `../templates/${name}.hbs`);
  logger.debug('### loadTemplate', { templatePath });
  const content = await fs.readFile(templatePath, 'utf-8');
  const template = await handlebars.compile(content);

  return template(Object.assign(context));
}

async function sendMail({ to, bcc, cc, subject, text, html, replyTo }) {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve();
  }
  const { fromName, fromEmail } = config.ses;
  const from = `${fromName} <${fromEmail}>`;
  logger.debug('### sendMail', { from });
  return transporter.sendMail({
    from,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    replyTo,
  });
}

/**
 *
 * @param {*} param0 information email
 * @param {*} param1 data input template
 * @returns
 */
async function sendWelcomeEmail({ to, bcc, cc, subject = 'Welcome to Biocare cardiac', text, html, replyTo }, paramsMail) {
  const { fullname, temporaryPassword, isValidEmailAndPhone, email, phone, address } = paramsMail;
  const content = html || await loadTemplate('Welcome', { fullname, temporaryPassword, isValidEmailAndPhone, email, phone, address });
  logger.debug('### sendWelcomeEmail', { html });
  return sendMail({
    to,
    cc,
    bcc,
    subject,
    text,
    html: content,
    replyTo,
  });
}

/**
 *
 * @param {*} param0 information email
 * @param {*} param1 data input template
 * @returns
 */
async function resendPasswordEmail({ to, bcc, cc, subject = 'Welcome to Biocare cardiac', text, html, replyTo }, paramsMail) {
  const { fullname, temporaryPassword } = paramsMail;
  const content = html || await loadTemplate('ResendPassword', { fullname, temporaryPassword });
  logger.debug('### Resend password', { html });
  return sendMail({
    to,
    cc,
    bcc,
    subject,
    text,
    html: content,
    replyTo,
  });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  resendPasswordEmail,
  loadTemplate,
};
