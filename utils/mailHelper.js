//This util helps us send mail to the user
//All info here is copy pasted from nodemailer documentation and SMTP is taken from mailtrap.
const nodemailer = require("nodemailer");

const mailHelper = async (option) => {
  //The SMTP host,port,server,user and password is brought in from a mail testing service called mailtrap
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  //SMTP- refers to simple mail transfer protocol

  const message = {
    from: "theprimegaming0123@gmail.com", // sender address
    to: option.email, // list of receivers
    subject: option.subject, // Subject line
    text: option.text, // plain text body
  };

  const info = await transporter.sendMail(message);
};

module.exports = mailHelper;
