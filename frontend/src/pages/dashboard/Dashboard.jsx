import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axios";
import {
  Activity,
  Users,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/departments");
        setDepartments(res.data.departments || []);
      } catch (err) {
        console.error("Failed to load departments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-800 to-sky-700 text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-primary-100 mb-3 border border-white/15">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            Authenticated as {user?.role?.replace("_", " ")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-2 text-primary-100 text-sm sm:text-base leading-relaxed">
            Welcome to the Smart Healthcare & Hospital Operations command
            center. Your role-based session is secure and active.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64" />
        </div>
      </div>

      {/* Quick Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Clinical Departments
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {departments.length} Active
            </h3>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Operational
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              System Role
            </p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 truncate max-w-[150px]">
              {user?.role?.replace("_", " ")}
            </h3>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-500" /> Granular
              RBAC Active
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Session Status
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              Authorized
            </h3>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" /> JWT Secure Token
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Audit Protocol
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              Immutable
            </h3>
            <span className="text-xs text-sky-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Audit Logging ON
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Hospital Departments Grid (Phase 1 Baseline) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Hospital Departments Directory
            </h2>
            <p className="text-xs text-slate-500">
              Configured clinical and diagnostic hospital branches
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
            {departments.length} Units
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary-200 transition shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary-100 text-primary-700">
                    {dept.code}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {dept.locationBuilding} • {dept.locationFloor}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {dept.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {dept.description}
                </p>
                {dept.headOfDepartment && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                    <span className="text-slate-400">Head:</span>
                    <span className="font-semibold">
                      {dept.headOfDepartment.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
