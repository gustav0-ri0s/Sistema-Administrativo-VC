
import React from 'react';
import { NAVIGATION_ITEMS, ROLE_LABELS } from '../constants';
import { Student, AcademicStatus, Profile, UserRole } from '../types';
import { useAcademicYear } from '../contexts/AcademicYearContext';
import { settingsService } from '../services/database.service';
import { LogOut, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  currentUser: Profile | null;
  userPermissions: string[];
}


const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose, onLogout, currentUser, userPermissions }) => {

  const { selectedYear, isYearReadOnly } = useAcademicYear();
  const [logoUrl, setLogoUrl] = React.useState('/image/logo.png');

  React.useEffect(() => {
    const loadLogo = async () => {
      try {
        const info = await settingsService.getInstitutionalInfo();
        if (info?.logoUrl) {
          setLogoUrl(info.logoUrl);
        }
      } catch (error) {
        console.error('Error loading logo in sidebar:', error);
      }
    };
    loadLogo();
  }, []);

  if (!currentUser) return null;

  const filteredItems = NAVIGATION_ITEMS.filter(item =>
    userPermissions.includes(item.id)
  );


  // Determine if current year is read-only
  const isReadOnly = selectedYear ? isYearReadOnly(selectedYear) : false;

  // Items that should be disabled in read-only mode
  const readOnlyRestrictedItems = ['enrollment', 'course-assignments', 'profiles'];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Valores y Ciencias</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Gestión Admisión</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isRestricted = isReadOnly && readOnlyRestrictedItems.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isRestricted) {
                    setActiveTab(item.id);
                    onClose();
                  }
                }}
                disabled={isRestricted}
                title={isRestricted ? 'Modo solo lectura - Año cerrado' : ''}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${activeTab === item.id
                  ? 'bg-[#57C5D5] text-white shadow-lg shadow-[#57C5D5]/20'
                  : isRestricted
                    ? 'text-slate-400 opacity-50 cursor-not-allowed grayscale'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                {item.icon}
                {item.label}
                {isRestricted && (
                  <span className="ml-auto text-[8px] bg-slate-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Solo lectura</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              {currentUser.full_name?.substring(0, 2).toUpperCase() || '??'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">{currentUser.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate text-left uppercase tracking-tighter">{ROLE_LABELS[currentUser.role]}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm font-black uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
