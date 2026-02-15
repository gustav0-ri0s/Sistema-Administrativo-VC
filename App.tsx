
import React, { useState, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
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

import { UserRole, AcademicYear, Profile } from './types';
import { profileService, rolePermissionService } from './services/database.service';

import { supabase } from './services/supabase';
import { AcademicYearProvider, useAcademicYear } from './contexts/AcademicYearContext';
import { ToastProvider } from './contexts/ToastContext';
import { Menu, School, Calendar, ChevronDown, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const ALLOWED_ROLES = [
  UserRole.ADMIN,
  UserRole.SUBDIRECTOR,
  UserRole.SUPERVISOR,
  UserRole.SECRETARIA
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [viewingYear, setViewingYear] = useState<number>(new Date().getFullYear());
  const [loadError, setLoadError] = useState<string | null>(null);

  const { academicYears, setAcademicYears, refreshYears, setSelectedYear } = useAcademicYear();

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

  const loadUserData = useCallback(async (userId: string) => {
    try {
      console.log('App: Fetching profile for:', userId);

      // Add a timeout to the fetch itself
      const fetchPromise = profileService.getById(userId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_DB')), 5000)
      );

      const userProfile = await Promise.race([fetchPromise, timeoutPromise]) as Profile;

      if (userProfile) {
        console.log('App: Profile loaded success');
        setCurrentUser(userProfile);

        try {
          const perms = await rolePermissionService.getByRole(userProfile.role);
          if (perms) {
            setUserPermissions(perms.modules);
          } else if (userProfile.role === UserRole.ADMIN) {
            setUserPermissions(['dashboard', 'academic-year', 'enrollment', 'areas', 'course-assignments', 'profiles', 'students', 'classrooms', 'settings', 'roles']);
          }
        } catch (e) {
          console.warn('App: Permissions load error, using default');
          if (userProfile.role === UserRole.ADMIN) {
            setUserPermissions(['dashboard', 'academic-year', 'enrollment', 'areas', 'course-assignments', 'profiles', 'students', 'classrooms', 'settings', 'roles']);
          }
        }
        setIsAuthenticated(true);
      } else {
        console.warn('App: Empty profile');
        setIsAuthenticated(false);
      }
    } catch (e: any) {
      console.error('App: loadUserData failed:', e);
      if (e.message === 'TIMEOUT_DB') {
        setLoadError('La base de datos está tardando demasiado en responder.');
      }
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    // Safety Force-Start: No matter what, stop loading after 8 seconds
    const globalTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('App: Safety bypass triggered');
        setIsLoading(false);
      }
    }, 8000);

    const initialize = async () => {
      try {
        console.log('App: Initializing process (once)...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session && isMounted) {
          console.log('App: Found active session during init');
          await loadUserData(session.user.id);
          refreshYears();
        } else {
          console.log('App: No session active during init');
        }
      } catch (err) {
        console.error('App: Initial load error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      console.log('App: Auth change event handler:', event);

      if (event === 'SIGNED_IN') {
        if (session) {
          console.log('App: User signed in, loading data...');
          await loadUserData(session.user.id);
          refreshYears();
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('App: User signed out, clearing state...');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserPermissions([]);
      }

      // Stop loading on any major auth transition
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(globalTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualBypass = () => {
    console.log('App: Manual bypass clicked');
    setIsLoading(false);
  };

  const handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-20 h-20 border-t-4 border-[#57C5D5] rounded-full animate-spin"></div>
        </div>
        <div className="mt-8 space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Iniciando Seguridad</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">Verificando credenciales institucionales...</p>
        </div>

        {/* Helper controls if it takes too long */}
        <div className="mt-12 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <button
            onClick={handleManualBypass}
            className="text-[10px] font-black text-[#57C5D5] uppercase tracking-widest hover:text-[#46b3c2] transition-colors"
          >
            ¿Demora demasiado? Omitir Carga
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Reiniciar Sesión
          </button>
        </div>

        {loadError && (
          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-xs">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">{loadError}</p>
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => { }} />;
  }

  // 1. FORCE PASSWORD CHANGE FLOW (Global Security Priority)
  if (currentUser?.force_password_change) {
    return (
      <ChangePassword
        userId={currentUser.id}
        onSuccess={() => {
          // Refresh user data to clear the flag in state
          console.log('App: Password changed successfully, refreshing state...');
          const updatedUser = { ...currentUser, force_password_change: false };
          setCurrentUser(updatedUser);
        }}
      />
    );
  }

  // 2. ROLE ACCESS RESTRICTION
  const isAccessRestricted = currentUser && !ALLOWED_ROLES.includes(currentUser.role);
  if (isAccessRestricted && currentUser) {
    return <RestrictedAccess role={currentUser.role} onLogout={handleReset} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <EnrollmentDashboard selectedYear={selectedYearData} />;
      case 'academic-year': return <AcademicYearManager years={academicYears} setYears={setAcademicYears} />;
      case 'enrollment': return <EnrollmentWizard academicYears={academicYears} onTabChange={setActiveTab} />;
      case 'areas': return <AreaCompetencyManager />;
      case 'course-assignments': return <CourseAssignmentMatrix />;
      case 'profiles': return <ProfileManagement />;
      case 'students': return <StudentManagement />;
      case 'classrooms': return <ClassroomManager />;
      case 'settings': return <SettingsManager />;
      case 'roles': return <RolesManager />;
      default: return <EnrollmentDashboard selectedYear={selectedYearData} />;
    }
  };

  return (
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
