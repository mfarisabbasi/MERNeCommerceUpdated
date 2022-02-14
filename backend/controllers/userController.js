import asyncHandler from "express-async-handler";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import {
  sendWelcomeEmail,
  sendResetPasswordEmail,
} from "../utils/emailSystem.js";

const client = new OAuth2Client(
  "1085866666703-1903vd6vuhr4tftd6nltucqru0j43q2l.apps.googleusercontent.com"
);

// @desc Auth user & get token
// @route POST /api/users/login
// @access Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const googleLogin = asyncHandler(async (req, res) => {
  const { token } = await req.body;

  client
    .verifyIdToken({
      idToken: token,
      audience:
        "1085866666703-1903vd6vuhr4tftd6nltucqru0j43q2l.apps.googleusercontent.com",
    })
    .then((response) => {
      const { email_verified, email, name } = response.payload;

      if (email_verified) {
        User.findOne({ email }, (err, user) => {
          if (err) {
            res.status(400).json({
              error: err,
            });
          }
          if (!user) {
            let password = email + process.env.JWT_SECRET;
            let newUser = new User({ name, email, password });
            newUser.save((err, createdUser) => {
              if (err) {
                res.status(400).json({
                  error: err,
                });
              }
              res.json({
                _id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                isAdmin: createdUser.isAdmin,
                token: generateToken(createdUser._id),
              });
            });
          } else {
            res.json({
              _id: user.id,
              name: user.name,
              email: user.email,
              isAdmin: user.isAdmin,
              token: generateToken(user._id),
            });
          }
        });
      } else {
        res.status(401);
        throw new Error("Error");
      }
    })
    .catch((err) => res.json({ err: `${err.message}` }));
});

// @desc Register a new user
// @route POST /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
    sendWelcomeEmail(user.email, user.name);
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc Get user profile
// @route GET /api/users/profile
// @access Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Update user profile
// @route PUT /api/users/profile
// @access Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Get all users
// @route GET /api/users
// @access Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// @desc Delete users
// @route DELETE /api/users/:id
// @access Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.remove();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Get user by ID
// @route GET /api/users/:id
// @access Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Update user
// @route PUT /api/users/:id
// @access Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin =
      req.body.isAdmin === undefined ? user.isAdmin : req.body.isAdmin;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc Send Reset Password Email
// @route POST /api/users/reset
// @access Public
const resetPasswordEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  crypto.randomBytes(32, (err, buffer) => {
    if (err) console.log(err);

    const token = buffer.toString("hex");
    if (!user) return res.status(422).json({ error: "User not found" });
    user.resetToken = token;
    user.expireToken = Date.now() + 3600000;
    user.save().then((result) => {
      sendResetPasswordEmail(email, token);
      res.json({ message: "Reset Password Email Sent" });
    });
  });
});

// @desc Reset Password
// @route POST /api/users/resetPassword/:token
// @access Private
const resetPassword = asyncHandler(async (req, res) => {
  const newPassword = req.body.password;
  const resetToken = req.params.token;
  const userBasedOnToken = await User.findOne({
    resetToken,
    expireToken: { $gt: Date.now() },
  });
  if (!userBasedOnToken) return res.json({ error: "Token expired" });
  userBasedOnToken.password = newPassword;
  userBasedOnToken.resetToken = undefined;
  userBasedOnToken.expireToken = undefined;
  await userBasedOnToken.save();
  res.status(200).json({
    status: "success",
    message: "Password changed, you can login now.",
  });
});

export {
  authUser,
  getUserProfile,
  registerUser,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  resetPasswordEmail,
  resetPassword,
  googleLogin,
};
