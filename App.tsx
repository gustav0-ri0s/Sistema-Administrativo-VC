
import React, { useState, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProfileManagement from './components/ProfileManagement';
import StudentManagement from './components/StudentManagement';
import AcademicYearManager from './components/AcademicYearManager';
import EnrollmentWizard from './components/EnrollmentWizard';
import EnrollmentDashboard from './components/EnrollmentDashboard';
import ClassroomManager from './components/ClassroomManager';
import AreaCompetencyManager from './components/AreaCompetencyManager';
import CourseAssignmentMatrix from './components/CourseAssignmentMatrix';
import SettingsManager from './components/SettingsManager';
import RolesManager from './components/RolesManager';
import RestrictedAccess from './components/RestrictedAccess';
import ChangePassword from './components/ChangePassword';
import AuthCallback from './components/AuthCallback';
import EnglishManagement from './components/EnglishManagement';
import { RequireAuth } from './components/RequireAuth';

import { UserRole, AcademicYear, Profile } from './types';
import { profileService, rolePermissionService } from './services/database.service';

import { supabase } from './services/supabase';
import { AcademicYearProvider, useAcademicYear } from './contexts/AcademicYearContext';
import { ToastProvider } from './contexts/ToastContext';
import { Menu, School, Calendar, ChevronDown, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in ms
const CHECK_INTERVAL = 60 * 1000; // 1 minute in ms
const ACTIVITY_KEY = 'vc_last_activity';


const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [viewingYear, setViewingYear] = useState<number>(new Date().getFullYear());

  const { academicYears, setAcademicYears, refreshYears, setSelectedYear } = useAcademicYear();

  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const path = location.pathname.split('/')[1];
    return path || 'dashboard';
  }, [location.pathname]);

  const setActiveTab = (tab: string) => {
    navigate(`/${tab}`);
  };

  const selectedYearData = useMemo(() =>
    academicYears.find(y => y.year === viewingYear),
    [viewingYear, academicYears]
  );

  // Sync viewingYear with AcademicYearContext so all components get the correct year
  React.useEffect(() => {
    if (selectedYearData) {
      setSelectedYear(selectedYearData);
    }
  }, [selectedYearData, setSelectedYear]);

  const handleUserLoaded = useCallback(async (userProfile: Profile) => {
    setCurrentUser(userProfile);
    try {
      const perms = await rolePermissionService.getByRole(userProfile.role);
      if (perms) {
        setUserPermissions(perms.modules);
      } else if (userProfile.role === UserRole.ADMIN) {
        setUserPermissions(['dashboard', 'academic-year', 'enrollment', 'areas', 'course-assignments', 'profiles', 'students', 'english', 'classrooms', 'settings', 'roles']);
      } else if (userProfile.role === UserRole.DOCENTE_INGLES) {
        setUserPermissions(['dashboard', 'english']);
      }
    } catch (e) {
      console.warn('App: Permissions load error, using default');
      if (userProfile.role === UserRole.ADMIN) {
        setUserPermissions(['dashboard', 'academic-year', 'enrollment', 'areas', 'course-assignments', 'profiles', 'students', 'english', 'classrooms', 'settings', 'roles']);
      } else if (userProfile.role === UserRole.DOCENTE_INGLES) {
        setUserPermissions(['dashboard', 'english']);
      }
    }
    refreshYears();
  }, [refreshYears]);

  React.useEffect(() => {
    let isMounted = true;

    // Auth change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      console.log('App: Auth change event handler:', event);

      if (event === 'SIGNED_OUT') {
        console.log('App: User signed out, clearing state...');
        setCurrentUser(null);
        setUserPermissions([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Idle Timeout Logic
  React.useEffect(() => {
    if (!currentUser) return;

    const checkIdleTimeout = () => {
      const lastActivity = localStorage.getItem(ACTIVITY_KEY);
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
        if (timeSinceLastActivity > IDLE_TIMEOUT) {
          console.warn('Idle timeout reached, signing out...');
          handleReset();
          return true;
        }
      }
      return false;
    };

    if (checkIdleTimeout()) return;

    const updateActivity = () => {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
    };

    updateActivity();

    const events = ['mousedown', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach(eventName => {
      window.addEventListener(eventName, updateActivity);
    });

    const interval = setInterval(checkIdleTimeout, CHECK_INTERVAL);

    return () => {
      events.forEach(eventName => {
        window.removeEventListener(eventName, updateActivity);
      });
      clearInterval(interval);
    };
  }, [currentUser]);

  const renderContent = () => {
    return (
      <Routes>
        <Route path="/dashboard" element={<EnrollmentDashboard selectedYear={selectedYearData} userRole={currentUser?.role} />} />
        <Route path="/academic-year" element={<AcademicYearManager years={academicYears} setYears={setAcademicYears} />} />
        <Route path="/enrollment" element={<EnrollmentWizard academicYears={academicYears} onTabChange={setActiveTab} />} />
        <Route path="/areas" element={<AreaCompetencyManager />} />
        <Route path="/course-assignments" element={<CourseAssignmentMatrix />} />
        <Route path="/profiles" element={<ProfileManagement />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/classrooms" element={<ClassroomManager />} />
        <Route path="/english" element={<EnglishManagement />} />
        <Route path="/settings" element={<SettingsManager />} />
        <Route path="/roles" element={<RolesManager />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  };


  const handleReset = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during signOut:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem(ACTIVITY_KEY);
    localStorage.clear();
    sessionStorage.clear();
    const portal = import.meta.env.VITE_PORTAL_URL || "https://portal-vc-academico.vercel.app";
    window.location.href = portal;
  };

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/*"
        element={
          <RequireAuth onUserLoaded={handleUserLoaded}>
            <div className="min-h-screen bg-slate-50 animate-in fade-in duration-500">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onLogout={handleReset}
                currentUser={currentUser}
                userPermissions={userPermissions}
              />

              <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 h-16">
                  <div className="flex items-center gap-2 lg:hidden">
                    <School className="w-6 h-6 text-[#57C5D5]" />
                    <span className="font-bold text-slate-900 text-sm">Valores y Ciencias</span>
                  </div>

                  <div className="hidden lg:flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedYearData?.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {selectedYearData?.is_active ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {selectedYearData?.is_active ? 'Ciclo Operativo' : selectedYearData?.status === 'planificación' ? 'Modo Planificación' : 'Modo Histórico'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <button className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:border-[#57C5D5] transition-all">
                        <Calendar className="w-4 h-4 text-[#57C5D5]" />
                        Viendo Ciclo: {selectedYearData?.year || viewingYear}
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:rotate-180 transition-transform" />
                      </button>

                      <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 shadow-2xl rounded-2xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
                        <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seleccionar Año</p>
                        {academicYears.sort((a, b) => b.year - a.year).map(y => (
                          <button
                            key={y.year}
                            onClick={() => setViewingYear(y.year)}
                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center justify-between hover:bg-slate-50 ${viewingYear === y.year ? 'text-[#57C5D5]' : 'text-slate-600'}`}
                          >
                            <span>Ciclo Académico {y.year}</span>
                            {y.is_active && <span className="text-[8px] bg-[#57C5D5] text-white px-2 py-0.5 rounded-full uppercase">Activo</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="lg:hidden p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Menu className="w-6 h-6" />
                    </button>
                  </div>
                </header>

                <main className="flex-1 p-4 md:p-10">
                  <div className="max-w-6xl mx-auto">
                    {renderContent()}
                  </div>
                </main>

                <footer className="mt-auto p-6 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
                  I.E.P. Valores y Ciencias &copy; {new Date().getFullYear()} - Módulo Administrativo
                </footer>
              </div>
            </div>
          </RequireAuth>
        }
      />
    </Routes>
  );
};

const AppWithProvider: React.FC = () => {
  return (
    <AcademicYearProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AcademicYearProvider>
  );
};

export default AppWithProvider;
