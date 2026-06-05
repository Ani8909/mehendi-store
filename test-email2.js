const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jyotimehndiartist@gmail.com',
    pass: 'tvow qkcq wsmd vkce'
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("FAILED WITH MEHNDI:", error);
  } else {
    console.log("SUCCESS WITH MEHNDI!");
  }
});
