
import React, { useState } from 'react';
import { Profile, UserRole, Assignment, Classroom } from '../types';
import { profileService, classroomService, courseAssignmentService } from '../services/database.service';
import { useToast } from '../contexts/ToastContext';
import {
  Users, UserPlus, Search, Edit3, Trash2, MapPin,
  Phone, Mail, Calendar as CalendarIcon, Shield,
  CheckCircle2, XCircle, MoreVertical, Loader2,
  X, Save, Eye, EyeOff, RefreshCw, Mars, Venus,
  ShieldCheck, ArrowRight, UserCheck
} from 'lucide-react';
import { supabase } from '../services/supabase';
import AssignmentPanel from './AssignmentPanel';

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.SUBDIRECTOR]: 'Subdirector',
  [UserRole.DOCENTE]: 'Docente',
  [UserRole.AUXILIAR]: 'Auxiliar',
  [UserRole.SECRETARIA]: 'Secretaria',
  [UserRole.SUPERVISOR]: 'Supervisor'
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  [UserRole.ADMIN]: <Shield className="w-5 h-5" />,
  [UserRole.SUBDIRECTOR]: <ShieldCheck className="w-5 h-5" />,
  [UserRole.DOCENTE]: <Users className="w-5 h-5" />,
  [UserRole.AUXILIAR]: <UserCheck className="w-5 h-5" />,
  [UserRole.SECRETARIA]: <Mail className="w-5 h-5" />,
  [UserRole.SUPERVISOR]: <Search className="w-5 h-5" />
};



const ProfileManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editingAssignments, setEditingAssignments] = useState<Assignment[]>([]);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [loadingDni, setLoadingDni] = useState(false);
  const [newProfile, setNewProfile] = useState<Partial<Profile>>({
    role: UserRole.DOCENTE,
    active: true,
    force_password_change: true
  });

  const { showToast } = useToast();

  const handleDniLookup = async (dni: string, isEditing: boolean) => {
    if (!dni || dni.length < 8) return;
    setLoadingDni(true);
    try {
      const { data, error } = await supabase.functions.invoke('reniec-lookup', {
        body: { dni }
      });
      if (error) throw error;
      if (data?.nombres) {
        const fullName = `${data.apellidoPaterno} ${data.apellidoMaterno}, ${data.nombres}`;
        if (isEditing && editingProfile) {
          setEditingProfile({ ...editingProfile, full_name: fullName });
        } else {
          setNewProfile({ ...newProfile, full_name: fullName, dni });
        }
        showToast('success', 'Datos autocompletados desde RENIEC');
      }
    } catch (err) {
      console.error('DNI Lookup error:', err);
      showToast('error', 'No se pudo encontrar el DNI');
    } finally {
      setLoadingDni(false);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      console.log('Fetching profiles...');
      const profilesData = await profileService.getAll().catch(e => { console.error('Error fetching profiles:', e); throw e; });

      console.log('Fetching classrooms...');
      const classroomsData = await classroomService.getAll().catch(e => { console.error('Error fetching classrooms:', e); throw e; });

      console.log('Fetching assignments...');
      // Allow assignments to fail gracefully if table doesn't exist yet, returning empty array
      const assignmentsData = await courseAssignmentService.getAll().catch(e => {
        console.error('Error fetching course assignments:', e);
        return [];
      });

      setProfiles(profilesData);
      setClassrooms(classroomsData);
      setCourseAssignments(assignmentsData);
    } catch (error) {
      console.error('Main fetchData error:', error);
      showToast('error', 'Error al cargar datos: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const openEditProfile = (profile: Profile) => {
    setEditingProfile({ ...profile, password: '' });

    // Initialize assignments based on current data
    const initialAssignments = classrooms.map(c => {
      const isRoomTutor = profile.is_tutor &&
        profile.tutor_classroom_id?.toString() === c.id.toString();

      const attendanceAssignment = courseAssignments.find(ca =>
        ca.profileId === profile.id && ca.classroomId === c.id
      );

      if (attendanceAssignment || isRoomTutor) {
        return {
          profileId: profile.id,
          classroomId: c.id,
          canAttendance: !!attendanceAssignment,
          canGrades: false,
          isTutor: !!isRoomTutor
        };
      }
      return null;
    }).filter(Boolean) as Assignment[];

    setEditingAssignments(initialAssignments);
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewProfile({ ...newProfile, password });
  };

  const handleCreateProfile = async () => {
    if (!newProfile.email || !newProfile.password || !newProfile.full_name) {
      showToast('Por favor completa los campos requeridos', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      console.log('ProfileManagement: Registering new user...', newProfile.email);

      const { password, ...rest } = newProfile;

      await profileService.adminCreateUser(
        newProfile.email!,
        password!,
        {
          full_name: newProfile.full_name!,
          role: newProfile.role!,
          active: true,
          dni: newProfile.dni!,
          force_password_change: newProfile.force_password_change || false
        }
      );

      showToast('success', 'Personal registrado exitosamente');
      setIsAddingProfile(false);
      setNewProfile({ role: UserRole.DOCENTE, active: true, force_password_change: true });
      fetchData();
    } catch (error: any) {
      console.error('ProfileManagement: Create error:', error);
      showToast('error', error.message || 'Error al crear perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;
    try {
      setIsUpdating(true);
      console.log('ProfileManagement: Starting consolidated update...', editingProfile.id);

      // 1. Separate password from the rest of the profile updates
      const { password, ...profileUpdates } = editingProfile;

      // 2. If password is provided, update it via admin service
      if (password && password.trim() !== '') {
        console.log('ProfileManagement: Triggering password update');
        await profileService.adminUpdatePassword(editingProfile.id, password);
      }

      // 3. Update Course Assignments (attendance system)
      console.log('ProfileManagement: Updating course assignments...');
      // Delete old
      const oldAssignments = courseAssignments.filter(ca => ca.profileId === editingProfile.id);
      for (const old of oldAssignments) {
        await courseAssignmentService.delete(old.id);
      }
      // Insert new
      const attendanceToCreate = editingAssignments
        .filter(a => a.canAttendance)
        .map(a => ({
          profile_id: editingProfile.id,
          classroom_id: parseInt(a.classroomId)
        }));

      if (attendanceToCreate.length > 0) {
        const { error: assignError } = await supabase
          .from('course_assignments')
          .insert(attendanceToCreate);
        if (assignError) throw assignError;
      }

      // 4. Update Profile (including tutor fields)
      const tutorAssignment = editingAssignments.find(a => a.isTutor);
      const cleanUpdates = {
        dni: profileUpdates.dni,
        full_name: profileUpdates.full_name,
        role: profileUpdates.role,
        email: profileUpdates.email,
        active: profileUpdates.active,
        gender: profileUpdates.gender,
        personal_email: profileUpdates.personal_email,
        phone: profileUpdates.phone,
        birth_date: profileUpdates.birth_date,
        address: profileUpdates.address,
        force_password_change: profileUpdates.force_password_change,
        is_tutor: !!tutorAssignment,
        tutor_classroom_id: tutorAssignment ? parseInt(tutorAssignment.classroomId) : null
      };

      console.log('ProfileManagement: Sending profile updates to DB:', cleanUpdates);
      await profileService.update(editingProfile.id, cleanUpdates);

      showToast('success', 'Perfil y asignaciones actualizados correctamente');
      setEditingProfile(null);
      setEditingAssignments([]);
      fetchData();
    } catch (error: any) {
      console.error('ProfileManagement: Consolidated update error:', error);
      showToast('error', error.message || 'Error al actualizar perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredProfiles = profiles
    .filter(p => {
      const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni?.includes(searchTerm);
      const matchesRole = roleFilter === 'all' || p.role === roleFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' ? p.active : !p.active);
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by active status first (true before false)
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      // Then alphabetically by name
      return a.full_name.localeCompare(b.full_name);
    });

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#57C5D5]" />
            Gestión de Personal
          </h2>
          <p className="text-slate-500 text-sm font-medium">Administra los accesos y perfiles del sistema.</p>
        </div>
        <button
          onClick={() => setIsAddingProfile(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#57C5D5] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-5 h-5" />
          Registrar Personal
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscador</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="DNI, nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-[#57C5D5]/20 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Estado</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${statusFilter === 'all' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${statusFilter === 'active' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${statusFilter === 'inactive' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                >
                  Inactivos
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Rol</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${roleFilter === 'all' ? 'bg-[#57C5D5] text-white border-[#57C5D5] shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                >
                  Todos
                </button>
                {Object.values(UserRole).map(role => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${roleFilter === role ? 'bg-[#57C5D5] text-white border-[#57C5D5] shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol y Acceso</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 text-[#57C5D5] animate-spin mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando Personal...</p>
                      </td>
                    </tr>
                  ) : filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-slate-400 font-medium">No se encontraron perfiles.</p>
                      </td>
                    </tr>
                  ) : filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-[#57C5D5]/10 text-[#57C5D5] flex items-center justify-center font-black text-sm">
                            {profile.full_name?.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none mb-1">{profile.full_name}</p>
                            <p className="text-xs text-slate-400 font-medium">{profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                            {ROLE_ICONS[profile.role]}
                          </span>
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{ROLE_LABELS[profile.role]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${profile.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {profile.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {profile.active ? 'Activo' : 'Inactivo'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingProfile(profile)}
                            className="p-2 text-slate-400 hover:text-[#57C5D5] hover:bg-[#57C5D5]/10 rounded-xl transition-all"
                            title="Ver detalles"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditProfile(profile)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {isAddingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#57C5D5]/10 rounded-xl text-[#57C5D5]"><UserPlus className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Registrar Personal</h3>
                  <p className="text-sm text-slate-500 font-medium">Crea un nuevo acceso administrativo.</p>
                </div>
              </div>
              <button disabled={isUpdating} onClick={() => setIsAddingProfile(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </header>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">DNI</label>
                  <div className="relative group">
                    <input
                      type="text"
                      maxLength={8}
                      value={newProfile.dni || ''}
                      onChange={(e) => setNewProfile({ ...newProfile, dni: e.target.value })}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5] transition-all"
                    />
                    <button
                      type="button"
                      disabled={loadingDni}
                      onClick={() => handleDniLookup(newProfile.dni || '', false)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#57C5D5] text-white rounded-lg shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-colors disabled:opacity-50"
                    >
                      {loadingDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                  <input
                    type="text"
                    value={newProfile.full_name || ''}
                    onChange={(e) => setNewProfile({ ...newProfile, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Institucional*</label>
                  <input
                    type="email"
                    required
                    value={newProfile.email || ''}
                    onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Contraseña*</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newProfile.password || ''}
                        onChange={(e) => setNewProfile({ ...newProfile, password: e.target.value })}
                        autoComplete="new-password"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#57C5D5] outline-none pr-12"
                        placeholder="Escribir o generar..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-2 whitespace-nowrap"
                    >
                      <RefreshCw className="w-4 h-4" /> Generar
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
                    <input
                      type="checkbox"
                      id="force_change_new"
                      checked={newProfile.force_password_change || false}
                      onChange={(e) => setNewProfile({ ...newProfile, force_password_change: e.target.checked })}
                      className="w-5 h-5 rounded-lg border-slate-300 text-[#57C5D5] focus:ring-[#57C5D5] cursor-pointer"
                    />
                    <label htmlFor="force_change_new" className="text-sm font-bold text-slate-600 select-none cursor-pointer flex-1">
                      Pedirle al usuario que cambie la contraseña cuando acceda
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Seleccionar Rol</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.values(UserRole).map((role) => (
                    <button
                      key={role}
                      onClick={() => setNewProfile({ ...newProfile, role })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${newProfile.role === role
                        ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5]'
                        : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600'
                        }`}
                    >
                      {ROLE_ICONS[role]}
                      <span className="text-[10px] font-bold uppercase">{ROLE_LABELS[role]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button disabled={isUpdating} onClick={() => setIsAddingProfile(false)} className="px-6 py-2 text-sm font-bold text-slate-400">Cancelar</button>
              <button disabled={isUpdating} onClick={handleCreateProfile} className="px-8 py-2.5 bg-[#57C5D5] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] flex items-center gap-2">
                {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</> : 'Registrar Personal'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300">
            <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#57C5D5]/10 rounded-xl text-[#57C5D5]">{ROLE_ICONS[editingProfile.role]}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Editar: {editingProfile.full_name}</h3>
                  <p className="text-sm text-slate-500 font-medium">Modifica los datos del personal.</p>
                </div>
              </div>
              <button onClick={() => setEditingProfile(null)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">DNI</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={editingProfile.dni || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, dni: e.target.value })}
                      className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5] transition-all"
                    />
                    <button
                      type="button"
                      disabled={loadingDni}
                      onClick={() => handleDniLookup(editingProfile.dni || '', true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#57C5D5] text-white rounded-lg shadow-lg shadow-[#57C5D5]/20 hover:bg-[#46b3c2] transition-colors disabled:opacity-50"
                    >
                      {loadingDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                  <input
                    type="text"
                    value={editingProfile.full_name || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Institucional</label>
                  <input
                    type="email"
                    value={editingProfile.email || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Correo Personal</label>
                  <input
                    type="email"
                    value={editingProfile.personal_email || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, personal_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Celular</label>
                  <input
                    type="text"
                    value={editingProfile.phone || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={editingProfile.birth_date || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, birth_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Dirección Domiciliaria</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      value={editingProfile.address || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]"
                      placeholder="Av. Las Lilas 123, Distrito"
                    />
                  </div>
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambiar Contraseña</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editingProfile.password || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, password: e.target.value })}
                      placeholder="•••••••• (Protegida)"
                      autoComplete="new-password"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#57C5D5]/20 focus:border-[#57C5D5] transition-all pr-12 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase italic">* Por seguridad, la clave actual está oculta. Solo escribe aquí si deseas cambiarla.</p>

                  <div className="mt-4 flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
                    <input
                      type="checkbox"
                      id="force_change_edit"
                      checked={editingProfile.force_password_change || false}
                      onChange={(e) => setEditingProfile({ ...editingProfile, force_password_change: e.target.checked })}
                      className="w-5 h-5 rounded-lg border-slate-300 text-[#57C5D5] focus:ring-[#57C5D5] cursor-pointer"
                    />
                    <label htmlFor="force_change_edit" className="text-sm font-bold text-slate-600 select-none cursor-pointer flex-1">
                      Pedirle al usuario que cambie la contraseña cuando acceda
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProfile({ ...editingProfile, active: true })}
                      className={`flex-1 py-2.5 rounded-xl border-2 transition-all ${editingProfile.active ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-500'}`}
                    >
                      Activo
                    </button>
                    <button
                      onClick={() => setEditingProfile({ ...editingProfile, active: false })}
                      className={`flex-1 py-2.5 rounded-xl border-2 transition-all ${!editingProfile.active ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-500'}`}
                    >
                      Inactivo
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sexo</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProfile({ ...editingProfile, gender: 'M' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${editingProfile.gender === 'M' ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5]' : 'border-slate-100 text-slate-500'}`}
                    >
                      <Mars className="w-4 h-4" /> Masculino
                    </button>
                    <button
                      onClick={() => setEditingProfile({ ...editingProfile, gender: 'F' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all ${editingProfile.gender === 'F' ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5]' : 'border-slate-100 text-slate-500'}`}
                    >
                      <Venus className="w-4 h-4" /> Femenino
                    </button>
                  </div>
                </div>
              </div>

              <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#57C5D5]" /> Nivel de Acceso y Rol
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(UserRole).map((role) => (
                    <button
                      key={role}
                      onClick={() => setEditingProfile({ ...editingProfile, role })}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${editingProfile.role === role
                        ? 'border-[#57C5D5] bg-[#57C5D5]/5 text-[#57C5D5] ring-2 ring-[#57C5D5]/20'
                        : 'border-white bg-white hover:border-slate-200 text-slate-600'
                        }`}
                    >
                      {ROLE_ICONS[role]}
                      <span className="text-xs font-bold">{ROLE_LABELS[role]}</span>
                    </button>
                  ))}
                </div>
              </section>

              <AssignmentPanel
                profile={editingProfile}
                classrooms={classrooms}
                assignments={editingAssignments}
                onChange={setEditingAssignments}
              />

            </div>
            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingProfile(null)} className="px-6 py-2 text-sm font-bold text-slate-400" disabled={isUpdating}>Cancelar</button>
              <button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="px-8 py-2.5 bg-[#57C5D5] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#57C5D5]/20 hover:bg-[#46b3c2] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#57C5D5]/10 text-[#57C5D5] flex items-center justify-center font-black text-lg">
                  {viewingProfile.full_name?.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{viewingProfile.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="p-1 bg-slate-200 rounded text-slate-500 scale-75">
                      {ROLE_ICONS[viewingProfile.role]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ROLE_LABELS[viewingProfile.role]}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingProfile(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </header>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información Personal</p>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <Shield className="w-4 h-4 text-slate-300" />
                      <span>DNI: {viewingProfile.dni || 'No registrado'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <CalendarIcon className="w-4 h-4 text-slate-300" />
                      <span>Nacimiento: {viewingProfile.birth_date || 'No registrado'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <Mars className="w-4 h-4 text-slate-300" />
                      <span>Sexo: {viewingProfile.gender === 'M' ? 'Masculino' : viewingProfile.gender === 'F' ? 'Femenino' : 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <Mail className="w-4 h-4 text-slate-300" />
                      <span className="truncate" title={viewingProfile.email}>{viewingProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <Phone className="w-4 h-4 text-slate-300" />
                      <span>{viewingProfile.phone || 'Sin teléfono'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                  <div className="mt-4 flex gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <MapPin className="w-5 h-5 text-slate-300 shrink-0" />
                    <span>{viewingProfile.address || 'Sin dirección registrada'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asignaciones Académicas</p>
                  <div className="mt-4 p-4 bg-[#57C5D5]/5 rounded-2xl border border-[#57C5D5]/10">
                    <div className="flex items-center gap-3 text-sm font-bold text-[#57C5D5]">
                      <ArrowRight className="w-4 h-4" />
                      <span>0 Aulas Asignadas</span>
                    </div>
                    <p className="text-[10px] text-[#57C5D5]/60 mt-1 uppercase font-bold">Ver en panel de asignaciones</p>
                  </div>
                </div>
              </div>
            </div>
            <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  openEditProfile(viewingProfile);
                  setViewingProfile(null);
                }}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Editar Perfil
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;