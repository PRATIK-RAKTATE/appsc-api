import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, KeyRound, Sparkles, ArrowRight, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Card, Badge } from '../../components/ui';

export const LoginPage = () => {
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP'
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const otpRefs = useRef([]);
  const { sendOtp, verifyOtp, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle 10-minute expiry countdown & resend cooldown
  useEffect(() => {
    let timer;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    let cooldownTimer;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    const result = await sendOtp(email, role);
    if (result.success) {
      setStep('OTP');
      setCountdown(600);
      setResendCooldown(60);
      setInfoMessage(`6-digit access code sent to ${email}`);
      // Focus first OTP field
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setErrorMessage(result.message);
    }
  };

  // Step 2: Handle OTP box input & paste
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    if (newOtp.every((digit) => digit !== '')) {
      triggerVerify(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpRefs.current[5]?.focus();
      triggerVerify(pastedData);
    }
  };

  const triggerVerify = async (codeToVerify) => {
    setErrorMessage('');
    const result = await verifyOtp(email, codeToVerify);
    if (result.success) {
      const from = location.state?.from?.pathname || (result.user?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the OTP.');
      return;
    }
    triggerVerify(fullCode);
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Glow backdrop subtle effect */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <Card className="glass-panel border-neutral-800/80 p-8 shadow-2xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-lg shadow-amber-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {step === 'EMAIL' ? 'Sign in to APPSC Prep' : 'Enter 6-Digit OTP'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1.5">
              {step === 'EMAIL'
                ? 'Passwordless authentication via verified email OTP'
                : `Verification code expires in ${formatTimer(countdown)}`}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && step === 'OTP' && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {/* Role Selector Tabs */}
              <div className="flex p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl mb-4">
                {['STUDENT', 'MENTOR', 'ADMIN'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      role === r
                        ? 'bg-amber-500 text-neutral-950 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
                autoFocus
              />

              {/* Quick Fill Chips for easy evaluation */}
              <div className="pt-1">
                <span className="text-[11px] text-neutral-500">Demo Accounts:</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('student@appsc.gov.in');
                      setRole('STUDENT');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60"
                  >
                    Student Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@appsc.gov.in');
                      setRole('ADMIN');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60"
                  >
                    Admin Demo
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full mt-4"
                isLoading={isLoading}
                icon={ArrowRight}
              >
                Send Verification Code
              </Button>
            </form>
          ) : (
            /* Step 2: 6-digit OTP Form */
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('EMAIL')}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleSendOtp}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                Verify & Continue
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-neutral-800/60 text-center">
            <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict 1-Session Policy Enforced with Real-Time Eviction</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
