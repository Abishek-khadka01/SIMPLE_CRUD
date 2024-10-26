import nodemailer from "nodemailer";
import dotenv from "dotenv"; // Correct the typo here
dotenv.config(); // Load environment variables

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.GOOGLE_USER, // Use environment variable for user
    pass: process.env.GOOGLE_PASS, // Use environment variable for password
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function main(email: string, otp: number): Promise<void> {
  console.log(process.env.GOOGLE_USER, process.env.GOOGLE_PASS); // Verify the environment variables are loaded correctly

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.GOOGLE_USER, // sender address
    to: email, // list of receivers
    subject: "OTP", // Subject line
    text: "Hello world?", // plain text body
    html: `<h2>Your Otp is </h2> <b> ${otp}</b>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
}

export { main };
