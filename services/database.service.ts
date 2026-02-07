
import { supabase } from './supabase';
import { Profile, Student, AcademicYear, Classroom, CurricularArea } from '../types';

export const profileService = {
    async getAll() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;
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
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Profile;
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
