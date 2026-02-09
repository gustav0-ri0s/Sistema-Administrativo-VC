import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AcademicYear, BimestreConfig, AcademicYearContextType } from '../types';
import { academicService } from '../services/database.service';
import { canEditGrades, isYearReadOnly as utilIsYearReadOnly } from '../utils/academicYear.utils';

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

interface AcademicYearProviderProps {
    children: ReactNode;
}

export const AcademicYearProvider: React.FC<AcademicYearProviderProps> = ({ children }) => {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch years from database
    const refreshYears = async () => {
        try {
            console.log('AcademicYearContext: Fetching years...');
            const years = await academicService.getYears();
            console.log('AcademicYearContext: Fetched', years.length, 'years');
            setAcademicYears(years);

            console.log('AcademicYearContext: Data ready, processing selection...');
            // Auto-select active year or first year
            if (!selectedYear || !years.find(y => y.id === selectedYear.id)) {
                const activeYear = years.find(y => y.is_active);
                const yearToSelect = activeYear || years[0] || null;
                console.log('AcademicYearContext: Auto-selecting year:', yearToSelect?.year);
                setSelectedYear(yearToSelect);
            } else {
                // Update selected year with fresh data
                const updatedSelectedYear = years.find(y => y.id === selectedYear.id);
                if (updatedSelectedYear) {
                    setSelectedYear(updatedSelectedYear);
                }
            }
        } catch (error) {
            console.error('AcademicYearContext: Error fetching years:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        refreshYears();
    }, []);

    // Helper functions
    const isYearActive = (year: AcademicYear): boolean => {
        return year.is_active;
    };

    const isYearReadOnly = (year: AcademicYear): boolean => {
        return utilIsYearReadOnly(year);
    };

    const canEditBimestre = (bimestre: BimestreConfig, year: AcademicYear): boolean => {
        const validation = canEditGrades(bimestre, year);
        return validation.canEdit;
    };

    const value: AcademicYearContextType = {
        selectedYear,
        setSelectedYear,
        academicYears,
        setAcademicYears,
        refreshYears,
        isYearActive,
        isYearReadOnly,
        canEditBimestre
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-[#57C5D5] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        Cargando Sistema Académico...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <AcademicYearContext.Provider value={value}>
            {children}
        </AcademicYearContext.Provider>
    );
};

// Custom hook to use the context
export const useAcademicYear = (): AcademicYearContextType => {
    const context = useContext(AcademicYearContext);
    if (context === undefined) {
        throw new Error('useAcademicYear must be used within an AcademicYearProvider');
    }
    return context;
};
