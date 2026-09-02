import nodemailer from "nodemailer";


console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "Loaded" : "Missing");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    console.log("Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw error;
  }
};