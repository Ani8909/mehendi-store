const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jyotimehendiartist@gmail.com',
    pass: 'tvowqkcqwsmdvkce' // Spaces removed
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log("TEST FAILED WITH NO SPACES:", error);
    
    // Try with spaces
    const transporterWithSpaces = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jyotimehendiartist@gmail.com',
        pass: 'tvow qkcq wsmd vkce'
      }
    });
    
    transporterWithSpaces.verify(function(err, succ) {
      if (err) {
         console.log("TEST FAILED WITH SPACES:", err);
      } else {
         console.log("TEST SUCCESSFUL WITH SPACES!");
      }
    });
  } else {
    console.log("TEST SUCCESSFUL WITH NO SPACES!");
  }
});
