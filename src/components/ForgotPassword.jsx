import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { sendOtp, verifyOtp, resetPassword } from '../services/LoginPageService.js';

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  showPassword,
  onToggleShowPassword,
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-gray-700">
        {label}
      </Label>

      {/* Flex wrapper acts as the visible "input box" */}
      <div className="flex h-11 w-full items-center rounded-lg border border-gray-200 bg-white px-3 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500">

        {/* Lock icon — left side */}
        <Lock className="h-4 w-4 flex-shrink-0 text-gray-400" />

        {/* Native input — grows to fill space */}
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-full flex-1 bg-transparent px-2 text-sm text-gray-800 outline-none placeholder:text-gray-500"
          required
        />

        {/* Eye toggle — right side, always inside the box */}
        <button
          type="button"
          onClick={onToggleShowPassword}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="flex-shrink-0 text-gray-400 transition-colors hover:text-gray-700 focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [email, setEmail] = useState('');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(90);
  const otpRefs = useRef([]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setErrorMessage(
        error.response?.data?.errors?.[0] ||
        'No account found with this email address.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    let nextValue = value;

    if (nextValue.length > 1) {
      nextValue = nextValue.charAt(0);
    }

    if (!/^\d*$/.test(nextValue)) return;

    const newOtp = [...otp];
    newOtp[index] = nextValue;
    setOtp(newOtp);

    if (nextValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
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
      setErrorMessage(
        error.response?.data?.errors?.[0] ||
        'Invalid or expired OTP. Please try again.'
      );
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
      otpRefs.current[0]?.focus();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.errors?.[0] || 'Failed to resend OTP.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
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
      setErrorMessage(
        error.response?.data?.errors?.[0] || 'Failed to reset password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const maskEmail = (emailValue) => {
    if (!emailValue) return '';

    const [name, domain] = emailValue.split('@');

    if (!domain) return emailValue;

    return `${name.charAt(0)}${'*'.repeat(
      Math.max(1, name.length - 1)
    )}@${domain}`;
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50/40 via-sky-50/20 to-indigo-100/30 p-6">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="animate-blob absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-500 mix-blend-multiply blur-3xl filter" />
        <div className="animate-blob animation-delay-2000 absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500 mix-blend-multiply blur-3xl filter" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/login')}
          className="mb-6 bg-white/50 text-gray-600 backdrop-blur-sm hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>

        <Card className="overflow-hidden rounded-2xl border-0 bg-white/95 shadow-2xl backdrop-blur-md">
          <CardHeader className="pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-blue-100 bg-blue-50 shadow-md"
            >
              {step === 4 ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <KeyRound className="h-8 w-8 text-blue-600" />
              )}
            </motion.div>

            <CardTitle className="text-2xl font-bold text-gray-800">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Enter Verification Code'}
              {step === 3 && 'Set New Password'}
              {step === 4 && 'Password Reset Complete'}
            </CardTitle>

            <p className="mt-2 text-sm text-gray-500">
              {step === 1 &&
                'Enter your email address to receive a verification code.'}
              {step === 2 &&
                `A verification code has been sent to ${maskEmail(email)}.`}
              {step === 3 &&
                'Create a new strong password for your account.'}
              {step === 4 &&
                'Your password has been successfully updated.'}
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            {errorMessage && (
              <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
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
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Email Address
                    </Label>

                    <div className="relative flex items-center">
                      <Mail className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />

                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@rudhrainfosolutions.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 w-full border border-gray-200 bg-white pl-10 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="h-11 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  >
                    {isLoading ? 'Sending...' : 'Send Verification Code'}
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
                  <div className="my-6 flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          otpRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleOtpChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="h-14 w-12 rounded-lg border-2 border-gray-200 bg-white text-center text-xl font-bold focus:border-blue-500 focus:ring-blue-500"
                      />
                    ))}
                  </div>

                  <div className="mb-2 text-sm font-medium text-gray-600">
                    Time remaining:{' '}
                    <span
                      className={
                        timeLeft < 60 ? 'text-red-500' : 'text-blue-600'
                      }
                    >
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || otp.join('').length < 6}
                    className="mt-4 h-11 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>

                  <div className="mt-4 text-sm">
                    <span className="text-gray-500">
                      Didn't receive the code?{' '}
                    </span>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={timeLeft > 0 || isLoading}
                      className={`font-medium ${timeLeft > 0
                          ? 'cursor-not-allowed text-gray-400'
                          : 'text-blue-600 hover:underline'
                        }`}
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
                  <PasswordInput
                    id="newPassword"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    showPassword={showNewPassword}
                    onToggleShowPassword={() =>
                      setShowNewPassword((prev) => !prev)
                    }
                  />

                  <PasswordInput
                    id="confirmPassword"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    showPassword={showConfirmPassword}
                    onToggleShowPassword={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                  />

                  <Button
                    type="submit"
                    disabled={isLoading || !newPassword || !confirmPassword}
                    className="mt-2 h-11 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </motion.form>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center"
                >
                  <Button
                    onClick={() => navigate('/login')}
                    className="h-11 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
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