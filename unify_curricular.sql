
-- 1. Create the UNIFIED Area (Using 'primaria' as the container for all, to avoid ENUM errors)
INSERT INTO curricular_areas (name, "order", level)
SELECT 'Competencias Transversales', 100, 'primaria'
WHERE NOT EXISTS (
    SELECT 1 FROM curricular_areas 
    WHERE name = 'Competencias Transversales' AND level = 'primaria'
);

-- 2. Move Data in a transaction block
DO $$
DECLARE
    unified_area_id INT;
BEGIN
    -- Get the ID of the new unified area
    SELECT id INTO unified_area_id FROM curricular_areas WHERE name = 'Competencias Transversales' AND level = 'primaria' LIMIT 1;

    -- Update linked competencies
    UPDATE competencies
    SET area_id = unified_area_id
    WHERE name ILIKE '%Gestiona su aprendizaje de manera autónoma%'
       OR name ILIKE '%Se desenvuelve en entornos virtuales%';

    -- Move any competencies currently in split versions of 'Competencias Transversales' (e.g. secundaria)
    UPDATE competencies
    SET area_id = unified_area_id
    WHERE area_id IN (
        SELECT id FROM curricular_areas 
        WHERE name = 'Competencias Transversales' AND level IN ('secundaria', 'inicial')
    );

    -- Delete the split area shells (if any other than the unified 'primaria' one exists)
    DELETE FROM curricular_areas 
    WHERE name = 'Competencias Transversales' AND level IN ('secundaria', 'inicial');

    -- Delete Tutoría assignments and competencies then the area
    DELETE FROM course_assignments 
    WHERE area_id IN (SELECT id FROM curricular_areas WHERE name ILIKE 'Tutoría%' OR name ILIKE '%Competencia Transversal TIC%');

    DELETE FROM competencies 
    WHERE area_id IN (SELECT id FROM curricular_areas WHERE name ILIKE 'Tutoría%' OR name ILIKE '%Competencia Transversal TIC%');

    DELETE FROM curricular_areas 
    WHERE name ILIKE 'Tutoría%' OR name ILIKE '%Competencia Transversal TIC%';
END $$;
