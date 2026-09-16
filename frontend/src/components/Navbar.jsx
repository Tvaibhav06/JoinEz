import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  FileText,
  LayoutDashboard,
  BarChart3,
  Eye,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import Badge from './Badge';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/assignments', label: 'Assignments', icon: FileText },
    { to: '/student/group', label: 'My Group', icon: Users }
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/assignments', label: 'Assignments', icon: FileText },
    { to: '/admin/monitoring', label: 'Monitoring', icon: Eye },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const navLinks = role === 'admin' ? adminLinks : studentLinks;

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-15">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <NavLink
              to={role === 'admin' ? '/admin' : '/student'}
              className="flex items-center space-x-2.5 font-bold text-slate-900 group select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-600 transition-colors">
                {role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  Joineazy
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {role === 'admin' ? 'Portal' : 'Student'}
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex md:space-x-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/student' || item.to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors btn-press ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            <div className="flex items-center space-x-2.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
              <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-500 leading-none mt-0.5 font-mono">
                  {user?.email}
                </span>
              </div>
              <Badge variant={role === 'admin' ? 'admin' : 'student'} size="sm">
                {role === 'admin' ? 'Admin' : 'Student'}
              </Badge>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors btn-press"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 btn-press"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <div className="p-3 mb-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">{user?.email}</p>
            </div>
            <Badge variant={role === 'admin' ? 'admin' : 'student'} size="sm">
              {role === 'admin' ? 'Admin' : 'Student'}
            </Badge>
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/student' || item.to === '/admin'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-2.5 opacity-70" />
                {item.label}
              </NavLink>
            );
          })}

          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
