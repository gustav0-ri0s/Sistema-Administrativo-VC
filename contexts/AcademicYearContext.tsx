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
    const refreshYears = React.useCallback(async () => {
        try {
            console.log('AcademicYearContext: Fetching years...');
            const years = await academicService.getYears();
            console.log('AcademicYearContext: Fetched', years.length, 'years');
            setAcademicYears(years);

            console.log('AcademicYearContext: Data ready, processing selection...');
            // Auto-select active year or first year
            setSelectedYear(prev => {
                if (!prev || !years.find(y => y.id === prev.id)) {
                    const activeYear = years.find(y => y.is_active);
                    const yearToSelect = activeYear || years[0] || null;
                    console.log('AcademicYearContext: Auto-selecting year:', yearToSelect?.year);
                    return yearToSelect;
                } else {
                    // Update selected year with fresh data
                    const updatedSelectedYear = years.find(y => y.id === prev.id);
                    return updatedSelectedYear || prev;
                }
            });
        } catch (error) {
            console.error('AcademicYearContext: Error fetching years:', error);
            // Even on error, we must stop loading to let the app show its login/main screen
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

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

    const value: AcademicYearContextType = React.useMemo(() => ({
        selectedYear,
        setSelectedYear,
        academicYears,
        setAcademicYears,
        refreshYears,
        isYearActive,
        isYearReadOnly,
        canEditBimestre
    }), [selectedYear, academicYears, refreshYears]);

    // We removed the blocking isLoading check here to prevent the "double loading" screen.
    // The App component handles the main system loading UI.
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
