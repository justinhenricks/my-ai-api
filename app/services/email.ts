import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  port: 465,
  host: "smtp.gmail.com",
  auth: {
    user: "justinhenricks@gmail.com",
    pass: process.env.GOOGLE_PASSWORD,
  },
  secure: true, // upgrades later with STARTTLS -- change this based on the PORT
});

export async function sendEmail({
  subject,
  text,
}: {
  subject: string;
  text: string;
}) {
  const mailOptions = {
    from: "justinhenricks@gmail.com",
    to: "justinhenricks@gmail.com",
    subject,
    text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
      // do something useful
    }
  });
}
