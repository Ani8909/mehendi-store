const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jyotimehndiartist999@gmail.com',
    pass: 'ssdwamqsxlqtumeg'
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("TEST FAILED WITH 999:", error);
  } else {
    console.log("TEST SUCCESSFUL WITH 999!");
  }
});
