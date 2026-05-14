import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sendOtp, verifyOtp, resetPassword } from '../services/LoginPageService.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Email
  const [email, setEmail] = useState('');

  // Step 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(90); // 1.5 minutes
  const otpRefs = useRef([]);

  // Step 3: Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      await sendOtp(email);
      toast.success('Verification code sent to your email.');
      setStep(2);
      setTimeLeft(90);
    } catch (error) {
      setErrorMessage(error.response?.data?.errors?.[0] || 'No account found with this email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setErrorMessage('Please enter the full 6-digit code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await verifyOtp(email, otpValue);
      setStep(3);
    } catch (error) {
      setErrorMessage(error.response?.data?.errors?.[0] || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await sendOtp(email);
      toast.success('Verification code resent to your email.');
      setTimeLeft(90);
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      setErrorMessage(error.response?.data?.errors?.[0] || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const otpValue = otp.join('');
      await resetPassword(email, otpValue, newPassword);
      toast.success('Password reset successfully. You can now login.');
      setStep(4);
    } catch (error) {
      setErrorMessage(error.response?.data?.errors?.[0] || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.charAt(0)}${'*'.repeat(Math.max(1, name.length - 1))}@${domain}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50/40 via-sky-50/20 to-indigo-100/30">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="w-full max-w-md z-10 relative">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/login')}
          className="mb-6 text-gray-600 hover:text-gray-900 bg-white/50 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
        </Button>

        <Card className="backdrop-blur-md bg-white/95 shadow-2xl border-0 overflow-hidden rounded-2xl">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden border-2 border-blue-100 shadow-md bg-blue-50 flex items-center justify-center"
            >
               {step === 4 ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <KeyRound className="w-8 h-8 text-blue-600" />}
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Enter Verification Code"}
              {step === 3 && "Set New Password"}
              {step === 4 && "Password Reset Complete"}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              {step === 1 && "Enter your email address to receive a verification code."}
              {step === 2 && `A verification code has been sent to ${maskEmail(email)}.`}
              {step === 3 && "Create a new strong password for your account."}
              {step === 4 && "Your password has been successfully updated."}
            </p>
          </CardHeader>
          
          <CardContent className="px-6 pb-8">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOtp}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@rudhrainfosolutions.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 text-sm bg-white border border-gray-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                  </Button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-6 text-center"
                >
                  <div className="flex justify-center gap-2 my-6">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-bold rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                      />
                    ))}
                  </div>
                  
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Time remaining: <span className={`${timeLeft < 60 ? 'text-red-500' : 'text-blue-600'}`}>{formatTime(timeLeft)}</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || otp.join('').length < 6}
                    className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white mt-4"
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </Button>

                  <div className="mt-4 text-sm">
                    <span className="text-gray-500">Didn't receive the code? </span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={timeLeft > 0 || isLoading}
                      className={`font-medium ${timeLeft > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
                    >
                      Resend OTP
                    </button>
                  </div>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleResetPassword}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-700 font-semibold text-sm">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 text-sm bg-white border border-gray-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 text-sm bg-white border border-gray-200 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !newPassword || !confirmPassword}
                    className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white mt-2"
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </motion.form>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Return to Login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
