import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";

class AuthController {
  // Register user
  static async register(req, res) {
    try {
      const { nama_pengguna, email, kata_sandi, ulangi_kata_sandi } = req.body;

      // Validasi input
      if (!nama_pengguna || !email || !kata_sandi || !ulangi_kata_sandi) {
        return res.status(400).json({ error: "Semua field harus diisi" });
      }

      if (kata_sandi !== ulangi_kata_sandi) {
        return res.status(400).json({ error: "Kata sandi tidak cocok" });
      }

      // Cek apakah email sudah terdaftar
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(kata_sandi, saltRounds);

      // Buat user baru
      const newUser = await UserModel.create({
        nama_pengguna,
        email,
        password_hash,
      });

      // Buat JWT token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "1h" }
      );

      res.status(201).json({
        message: "Registrasi berhasil",
        user: { id: newUser.id, nama_pengguna: newUser.nama_pengguna, email: newUser.email },
        token,
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, kata_sandi } = req.body;

      // Validasi input
      if (!email || !kata_sandi) {
        return res.status(400).json({ error: "Email dan kata sandi harus diisi" });
      }

      // Cari user berdasarkan email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Email atau kata sandi salah" });
      }

      // Verifikasi password
      const isPasswordValid = await bcrypt.compare(kata_sandi, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Email atau kata sandi salah" });
      }

      // Buat JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "1h" }
      );

      res.json({
        message: "Login berhasil",
        user: { id: user.id, nama_pengguna: user.nama_pengguna, email: user.email },
        token,
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ error: "Terjadi kesalahan server" });
    }
  }
}

export default AuthController;