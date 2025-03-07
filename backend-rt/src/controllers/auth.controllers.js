import User from "../models/user.model.js";
import jwt from 'jsonwebtoken'; 
import nodemailer from "nodemailer";
import crypto from 'crypto';
import e from "express";

const userGmail = "prueba34443@gmail.com"
const passwordGmail = "prueba2432"

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
