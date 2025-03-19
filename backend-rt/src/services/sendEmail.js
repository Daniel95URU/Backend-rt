import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: 'emailsenderprueba@gmail.com', 
      pass: 'Prueba12345678', //prueba con tu correo y contraseña DE APLICACIÓN ejemplo "nabv rzgn eeyq tycz" 'https://myaccount.google.com/apppasswords"
    },
  });

  const verificationUrl = `http://localhost:3000/auth/verify-email/${token}`;

  const mailOptions = {
    from: 'emailsenderprueba@gmail.com',
    to: email,
    subject: 'Verificación de email - PeliculAPPS 🎥',
    text: `Por favor, verifica tu email haciendo click al siguiente enlace: ${verificationUrl}`,
  };

  await transporter.sendMail(mailOptions);
};