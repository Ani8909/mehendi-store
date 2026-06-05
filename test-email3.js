const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jyotimehendiartist@gmail.com',
    pass: 'ssdwamqsxlqtumeg'
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("FAILED WITH NEW PWD:", error);
  } else {
    console.log("SUCCESS WITH NEW PWD!");
  }
});
