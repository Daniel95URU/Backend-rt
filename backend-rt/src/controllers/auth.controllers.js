import User from "../models/user.model.js";
import jwt from 'jsonwebtoken'; 
import nodemailer from "nodemailer";
import crypto from 'crypto';
import e from "express";

const userGmail = "emailsenderprueba@gmail.com"
const passwordGmail = "Prueba12345678"

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: userGmail, 
    pass: passwordGmail    
  },
  logger: true,  
  debug: true    
});


export const register = async (req, res) => {
  try {
    const { email_user, password, username } = req.body;

    if (!email_user || !password || !username) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_user)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const passwordRegex = /^.{8,}$/; 
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe tener 8 caracteres' });
    }

    const existingEmail = await User.findOne({ email_user });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username ya registrado' });
    }

    
    const newUser = new User({
      username,
      email_user,
      password_user: password,
    });

    
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado correctamente!' });
  } catch (err) {
    console.log("Error en el registro:", err);
    res.status(500).json({ message: 'Error al registrarse' });
  }
};


export const createLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body; 
    console.log(identifier, password);

    const user = await User.findOne({
      $or: [{ username: identifier }, { email_user: identifier }],
    });
    console.log(user);

    if (user) {
      if (password === user.password_user) {
        req.session.isLoggedIn = true;
        req.session.username = user.email_user;

        const sessionId = req.session.id;
        const personId = user._id;
        console.log(`Tu SessionID es: ${sessionId}`);

        res.status(200).json({
          success: true,
          message: "Login correcto...",
          personId,
        });
        return;
      }
    }
    res.status(401).json({ success: false, message: "Credenciales erróneas" });
  } catch (err) {
    console.error('Error de login:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

console.log("Doctorísimo D")

export const resetPassword = async (req, res) => {
  const { email_user } = req.body;

  if (!email_user) {
    return res.status(400).json({ message: 'El correo electrónico es obligatorio.' });
  }

  try {
    const user = await User.findOne({ email_user });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();

    const expiresIn = new Date();
    expiresIn.setMinutes(expiresIn.getMinutes() + 10);


    user.token = resetCode;
    user.resetTokenExpires = expiresIn;

    await user.save();

    const mailOptions = {
      from: 'emailsenderprueba@gmail.com@gmail.com', 
      to: email_user,            
      subject: 'Restablecimiento de contraseña',
      text: `Hola ${user.username},\n\nTu código de restablecimiento de contraseña es: ${resetCode}. Este código es válido por 10 minutos.\n\nSaludos,\nTu equipo`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo.' });
      } else {
        console.log('Correo enviado: ' + info.response);
        return res.status(200).json({ message: 'Correo de restablecimiento enviado exitosamente.', resetCode });
      }
    });

  } catch (err) {
    console.error('Error en la solicitud de restablecimiento de contraseña:', err);
    return res.status(500).json({ message: 'Error en la solicitud de restablecimiento de contraseña.' });
  }
};


export const checkResetToken = async (req, res) => {
  const { email_user, resetCode } = req.body;
  console.log(req.body)
  console.log(email_user, resetCode)

  try {
    const user = await User.findOne({ email_user });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (user.token !== resetCode || new Date() > user.resetTokenExpires) {
      return res.status(400).json({ message: 'Código inválido o ha expirado.' });
    }

    return res.status(200).json({ message: 'El código es válido. Puedes restablecer la contraseña.' });

  } catch (err) {
    console.error('Error verificando el código:', err);
    return res.status(500).json({ message: 'Error verificando el código.' });
  }
};



export const savePassword = async (req, res) => {
  const { email_user, newPassword, confirmPassword } = req.body;

  console.log(req.body)

  if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.^#])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres, contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial.' });
  }

  try {
     
      const user = await User.findOneAndUpdate(
          { email_user },
          { password_user:newPassword },
          { new: true }
      );

      if (!user) {
          return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.status(200).json({ message: "Contraseña actualizada." });
  } catch (err) {
      console.error('Error al actualizar la contraseña:', err);
      res.status(500).json({ message: 'Server error' });
  }
};

export const getUserInfoById = async (req, res) => {
  const { userId } = req.params; 

  try {
    const user = await User.findById(userId, 'email_user username'); 

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({ email: user.email_user, username: user.username });
  } catch (error) {
    console.error("Error al obtener la información del usuario:", error);
    res.status(500).json({ message: "Error al obtener la información del usuario", error: error.message });
  }
};


export const eraseAccount = async (req, res) => {
  const { username } = req.body;

  try {
      const result = await User.findOneAndDelete({username});
      if (result) {
          res.status(200).json({ message: `Usuario con el email ${username} eliminado correctamente.` });
      } else {
          res.status(404).json({ message: `Usuario con el email ${username} no encontrado.` });
      }
  } catch (err) {
      res.status(500).json({ message: 'Error al borrar el usuario', error: err.message });
  }
};


export const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.status(200).json({ message: "Logout" });
  } catch (err) {
    console.error('Error logout:', err);
    res.status(500).json({ message: "Server error" });
  }
}
