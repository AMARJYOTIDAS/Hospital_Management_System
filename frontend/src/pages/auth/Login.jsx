import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, clearError } from "../../store/slices/authSlice";
import { Activity, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth,
  );

  const redirectPath = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginUser({ email, password }));
  };

  // Demo credential autofill helper
  const handleDemoFill = (demoEmail, demoPass = "Password@123") => {
    dispatch(clearError());
    setEmail(demoEmail);
    setPassword(demoPass);
    dispatch(loginUser({ email: demoEmail, password: demoPass }));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center text-white shadow-xl shadow-primary-500/20 ring-4 ring-white/10">
            <Activity className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-white">
          Smart Healthcare Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Sign in to access your authorized clinical and administrative console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-300 font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) dispatch(clearError());
                  }}
                  placeholder="name@hospital.com"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#forgot"
                  className="text-xs text-primary-400 hover:text-primary-300 transition"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) dispatch(clearError());
                  }}
                  placeholder="••••••••••••"
                  className="block w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary-600/30 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick 1-Click Role Login (Demo)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill("superadmin@smarthealth.com")}
                className="py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition text-left truncate"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("admin@smarthealth.com")}
                className="py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition text-left truncate"
              >
                🏥 Hospital Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("dr.smith@smarthealth.com")}
                className="py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition text-left truncate"
              >
                🩺 Doctor
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("pharmacist@smarthealth.com")}
                className="py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition text-left truncate"
              >
                💊 Pharmacist
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("receptionist@smarthealth.com")}
                className="py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition text-left truncate"
              >
                🛎️ Receptionist
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill("accountant@smarthealth.com")}
                className="py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition text-left truncate"
              >
                💳 Accountant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
