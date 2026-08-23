// validations/authValidation.js
const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  password: Joi.string().min(6).required(),
  dob: Joi.date().iso().required(),
  userType: Joi.string().valid('student', 'instructor').required(),
});

const otpVerifySchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const forgotSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyForgotOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  password: Joi.string().min(6).required(),
});
const resendForgotOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

module.exports = {
  registerSchema,
  otpVerifySchema,
  resendOtpSchema,
  loginSchema,
  forgotSchema,
  verifyForgotOtpSchema,
  resendForgotOtpSchema
};