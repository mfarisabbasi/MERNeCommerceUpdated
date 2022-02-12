// Email Imports
import nodemailer from "nodemailer";
import mg from "nodemailer-mailgun-transport";

const auth = {
  auth: {
    api_key: "c5bf937763763dd1d7826f23265473f6-d2cc48bc-f2e3c2aa",
    domain: "sandboxfb7265f5389c4b0f93b06cb154db979b.mailgun.org",
  },
};

const nodemailerMailgun = nodemailer.createTransport(mg(auth));

const sendWelcomeEmail = (email, name) => {
  nodemailerMailgun.sendMail(
    {
      from: "test@test.com",
      to: email,
      subject: "Welcome Email",
      html: `<b>Hello ${name}, Welcome To TheNovusTech</b>`,
    },
    (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    }
  );
};

const sendResetPasswordEmail = (email, token) => {
  nodemailerMailgun.sendMail(
    {
      from: "test@test.com",
      to: email,
      subject: "Reset Password",
      html: `
      <p>You Requested To Reset Your Password</p>
      <b><a href='http://localhost:5000/users/reset/${token}'>Click Here</a> To Reset Your Password</b>
      `,
    },
    (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    }
  );
};

export { sendWelcomeEmail, sendResetPasswordEmail };
