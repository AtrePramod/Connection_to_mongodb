// app.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();                               // reads .env if present

// ---------- 1. MongoDB connection ----------
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pramod';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => {
    console.error('❌  MongoDB connection error:', err);
    process.exit(1);
  });

// ---------- 2. User model ----------
const userSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age:   { type: Number }
});

const User = mongoose.model('User', userSchema);

// ---------- 3. Express setup ----------
const app = express();
app.use(express.json());

// GET /users  → list all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /users  → create new user
app.post('/users', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const newUser = new User({ name, email, age });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---------- 4. Start server ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀  API ready at http://localhost:${PORT}`));
