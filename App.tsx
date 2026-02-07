
import React, { useState, useMemo } from 'react';
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
import { UserRole, AcademicYear, BimestreConfig, Profile } from './types';
import { academicService, profileService } from './services/database.service';
import { supabase } from './services/supabase';
import { AcademicYearProvider, useAcademicYear } from './contexts/AcademicYearContext';
import { Menu, School, Calendar, ChevronDown, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const createDefaultBimestres = (year: number): BimestreConfig[] => [
  { id: 1, name: 'I Bimestre', start_date: `${year}-03-01`, end_date: `${year}-05-15`, is_locked: false },
  { id: 2, name: 'II Bimestre', start_date: `${year}-05-20`, end_date: `${year}-07-25`, is_locked: true },
  { id: 3, name: 'III Bimestre', start_date: `${year}-08-10`, end_date: `${year}-10-15`, is_locked: true },
  { id: 4, name: 'IV Bimestre', start_date: `${year}-10-20`, end_date: `${year}-12-20`, is_locked: true },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('App: Initialization timeout reached');
        setIsLoading(false);
      }
    }, 10000);

    const loadUserData = async (userId: string) => {
      try {
        const userProfile = await profileService.getById(userId);
        if (userProfile) {
          setCurrentUser(userProfile);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          alert('Tu cuenta de usuario no tiene un perfil administrativo asociado.');
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    };

    const initializeAuth = async () => {
      try {
        console.log('App: Initializing auth stage 1...');
        const { data: { session }, error: sessionError } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 5000))
        ]) as any;

        if (sessionError) {
          console.warn('App: Session error (non-critical):', sessionError);
        }

        if (session) {
          console.log('App: Session found, loading profile...');
          await loadUserData(session.user.id);
        } else {
          console.log('App: No session found');
        }

        console.log('App: Loading academic years...');
        const years = await academicService.getYears();
        console.log('App: Years loaded successfully:', years.length);
        setAcademicYears(years);

        if (years.length > 0) {
          const active = years.find(y => y.is_active) || years[0];
          setViewingYear(active.year);
        }
      } catch (error) {
        console.error('CRITICAL: App failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await loadUserData(session.user.id);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const [viewingYear, setViewingYear] = useState<number>(new Date().getFullYear());

  const selectedYearData = useMemo(() =>
    academicYears.find(y => y.year === viewingYear),
    [viewingYear, academicYears]
  );

  const handleLogin = (email: string) => {
    // La sesión la maneja el componente Login vía supabase.auth.signInWithPassword
    // onAuthStateChange en el useEffect detectará el cambio y cargará el perfil
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveTab('dashboard');
    } catch (e) {
      console.error('Error signing out:', e);
      // Fallback manual reset
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#57C5D5] animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Sistema...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EnrollmentDashboard selectedYear={selectedYearData} />;
      case 'academic-year':
        return <AcademicYearManager years={academicYears} setYears={setAcademicYears} />;
      case 'enrollment':
        return <EnrollmentWizard academicYears={academicYears} />;
      case 'areas':
        return <AreaCompetencyManager />;
      case 'course-assignments':
        return <CourseAssignmentMatrix />;
      case 'profiles':
        return <ProfileManagement />;
      case 'students':
        return <StudentManagement />;
      case 'classrooms':
        return <ClassroomManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return <EnrollmentDashboard selectedYear={selectedYearData} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-500">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 h-16">
          <div className="flex items-center gap-2 lg:hidden">
            <School className="w-6 h-6 text-[#57C5D5]" />
            <span className="font-bold text-slate-900 text-sm">Valores y Ciencias</span>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedYearData?.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
              {selectedYearData?.is_active ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {selectedYearData?.is_active ? 'Ciclo Operativo' : selectedYearData?.status === 'planificación' ? 'Modo Planificación' : 'Modo Histórico'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:border-[#57C5D5] transition-all">
                <Calendar className="w-4 h-4 text-[#57C5D5]" />
                Viendo Ciclo: {viewingYear}
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

// Wrap the entire app with the Academic Year Provider
const AppWithProvider: React.FC = () => {
  return (
    <AcademicYearProvider>
      <App />
    </AcademicYearProvider>
  );
};

export default AppWithProvider;
