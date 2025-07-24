import { Router } from "express";
import {
  requestOTPForRegistration,
  verifyOTPAndRegister,
  requestOTPForLogin,
  verifyOTPAndLogin,
  requestOTPForPasswordReset,
  verifyOTPAndResetPassword,
} from "@/controller/otp";

const router = Router();

// Registration with OTP
router.post("/register/request-otp", requestOTPForRegistration);
router.post("/register/verify-otp", verifyOTPAndRegister);

// Login with OTP
router.post("/login/request-otp", requestOTPForLogin);
router.post("/login/verify-otp", verifyOTPAndLogin);

// Password reset with OTP
router.post("/password-reset/request-otp", requestOTPForPasswordReset);
router.post("/password-reset/verify-otp", verifyOTPAndResetPassword);

export default router;
