
import { supabase } from './supabase';
import { Profile, Student, AcademicYear, Classroom, CurricularArea, IncidentSummary } from '../types';

export const profileService = {
    async getAll() {
        console.log('profileService: getAll() called');
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('profileService: getAll() error:', error);
            throw error;
        }
        console.log('profileService: getAll() returned', data?.length, 'profiles');
        return data as Profile[];
    },

    async create(profile: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .insert([profile])
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async update(id: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async getById(id: string) {
        console.log('profileService: getById() called for ID:', id);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('profileService: getById() error:', error);
            throw error;
        }
        console.log('profileService: getById() found profile:', data?.full_name);
        return data as Profile;
    },

    async adminCreateUser(email: string, password: string, userData: Partial<Profile>) {
        console.log('profileService: adminCreateUser() called for', email);
        const { data, error } = await supabase.functions.invoke('admin-auth-handler', {
            body: { action: 'create_user', email, password, userData }
        });

        if (error) {
            console.error('profileService: adminCreateUser() error:', error);
            throw error;
        }
        return data;
    },

    async adminUpdatePassword(profile_id: string, password: string) {
        console.log('profileService: adminUpdatePassword() called for', profile_id);
        const { data, error } = await supabase.functions.invoke('admin-auth-handler', {
            body: { action: 'update_password', profile_id, password }
        });

        if (error) {
            console.error('profileService: adminUpdatePassword() error:', error);
            throw error;
        }
        return data;
    },

    async getActiveCount() {
        console.log('profileService: getActiveCount() called');
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('active', true);

        if (error) {
            console.error('profileService: getActiveCount() error:', error);
            return 0;
        }
        return count || 0;
    }
};

export const studentService = {
    async getAll() {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('last_name', { ascending: true });

        if (error) throw error;
        return data as Student[];
    },

    async create(student: Partial<Student>) {
        const { data, error } = await supabase
            .from('students')
            .insert([student])
            .select()
            .single();

        if (error) throw error;
        return data as Student;
    },

    async getCountByYear(academicYearId: number) {
        console.log('studentService: getCountByYear() called for year ID:', academicYearId);
        const { count, error } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('academic_year_id', academicYearId);

        if (error) {
            console.error('studentService: getCountByYear() error:', error);
            return 0;
        }
        return count || 0;
    }
};

export const academicService = {
    async getYears() {
        console.log('DB Service: Fetching academic years...');
        const { data, error } = await supabase
            .from('academic_years')
            .select('*, bimestres(*)')
            .order('year', { ascending: false });

        if (error) {
            console.error('DB Service: Error fetching years:', error);
            throw error;
        }
        console.log('DB Service: Fetched years:', data);
        return data as AcademicYear[];
    },

    async updateYear(id: number, updates: Partial<AcademicYear>) {
        console.log('DB Service: Updating year', id, 'with:', updates);
        const { error } = await supabase
            .from('academic_years')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('DB Service: Error updating year:', error);
            throw error;
        }
        console.log('DB Service: Year updated successfully');
    },

    async activateYear(yearId: number) {
        console.log('DB Service: Activating year', yearId);

        // First, deactivate all years
        const { error: deactivateError } = await supabase
            .from('academic_years')
            .update({ is_active: false })
            .neq('id', 0); // Update all rows

        if (deactivateError) {
            console.error('DB Service: Error deactivating years:', deactivateError);
            throw deactivateError;
        }

        // Then activate the target year and set it to 'abierto'
        const { error: activateError } = await supabase
            .from('academic_years')
            .update({ is_active: true, status: 'abierto' })
            .eq('id', yearId);

        if (activateError) {
            console.error('DB Service: Error activating year:', activateError);
            throw activateError;
        }

        console.log('DB Service: Year activated successfully');
    },

    async updateBimestre(id: number, updates: { is_locked?: boolean; is_force_open?: boolean }) {
        console.log('DB Service: Updating bimestre', id, 'with:', updates);
        const { error } = await supabase
            .from('bimestres')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('DB Service: Error updating bimestre:', error);
            throw error;
        }
        console.log('DB Service: Bimestre updated successfully');
    },

    async createYear(year: number, status: string) {
        console.log('DB Service: Creating year', year, 'with status', status);
        const { data: yearData, error: yearError } = await supabase
            .from('academic_years')
            .insert([{ year, status, is_active: false }])
            .select()
            .single();

        if (yearError) {
            console.error('DB Service: Error creating year:', yearError);
            throw yearError;
        }
        console.log('DB Service: Year created:', yearData);

        const bimestres = [
            { academic_year_id: yearData.id, name: 'I Bimestre', start_date: `${year}-03-01`, end_date: `${year}-05-15`, is_locked: false },
            { academic_year_id: yearData.id, name: 'II Bimestre', start_date: `${year}-05-20`, end_date: `${year}-07-25`, is_locked: true },
            { academic_year_id: yearData.id, name: 'III Bimestre', start_date: `${year}-08-10`, end_date: `${year}-10-15`, is_locked: true },
            { academic_year_id: yearData.id, name: 'IV Bimestre', start_date: `${year}-10-20`, end_date: `${year}-12-20`, is_locked: true },
        ];

        console.log('DB Service: Creating bimestres for year', year);
        const { error: bimError } = await supabase.from('bimestres').insert(bimestres);
        if (bimError) {
            console.error('DB Service: Error creating bimestres:', bimError);
            throw bimError;
        }
        console.log('DB Service: Bimestres created successfully');

        return yearData;

    }
};

export const incidentService = {
    async getRecent(limit: number = 5) {
        console.log('DB Service: Fetching recent incidents...');
        const { data, error } = await supabase
            .from('incidents')
            .select('id, correlative, type, status, incident_date')
            .order('incident_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('DB Service: Error fetching incidents:', error);
            // Return empty array instead of throwing to prevent crashing the dashboard
            return [];
        }
        return data as IncidentSummary[];
    },

    async getStats() {
        try {
            // Get total count
            const { count: total, error: totalError } = await supabase
                .from('incidents')
                .select('*', { count: 'exact', head: true });

            if (totalError) throw totalError;

            // Get pending count (not 'resuelta' or 'resolved')
            // Using a raw filter because 'neq' might be case sensitive depending on collation, 
            // but for now we assume standard behavior or we can fetch all status if needed.
            // Simplified approach: fetch all statuses and count in JS if dataset is small, 
            // OR use multiple queries. 
            // Robust approach: 
            const { data: allIncidents, error: listError } = await supabase
                .from('incidents')
                .select('status');

            if (listError) throw listError;

            const pending = allIncidents.filter(i => {
                const s = i.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return s !== 'resuelta' && s !== 'resolved';
            }).length;

            return { total: total || 0, pending };

        } catch (error) {
            console.error('DB Service: Error fetching stats:', error);
            return { total: 0, pending: 0 };
        }
    }
};

export const classroomService = {
    async getAll() {
        console.log('classroomService: getAll() called');
        const { data, error } = await supabase
            .from('classrooms')
            .select('*')
            .order('level', { ascending: true })
            .order('grade', { ascending: true })
            .order('section', { ascending: true });

        if (error) {
            console.error('classroomService: getAll() error:', error);
            throw error;
        }

        // Since 'enrolled' is not in the DB yet, we'll default it to 0
        // Eventually we should join with a student_enrollments table
        return data.map(item => ({
            ...item,
            enrolled: 0,
            active: item.active ?? true // Ensure active has a value
        })) as Classroom[];
    },

    async create(classroom: Partial<Classroom>) {
        const { enrolled, ...dbData } = classroom as any;
        if (dbData.level) dbData.level = dbData.level.toLowerCase();

        const { data, error } = await supabase
            .from('classrooms')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return data as Classroom;
    },

    async update(id: string | number, updates: Partial<Classroom>) {
        console.log('classroomService: update() called', { id, updates });
        const { enrolled, ...dbUpdates } = updates as any; // Strip non-DB fields

        // Ensure level is lowercase if present
        if (dbUpdates.level) {
            dbUpdates.level = dbUpdates.level.toLowerCase();
        }

        const { data, error } = await supabase
            .from('classrooms')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('classroomService: update() error:', error);
            throw error;
        }
        return data as Classroom;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('classrooms')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

