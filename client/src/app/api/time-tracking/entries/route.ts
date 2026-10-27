import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = searchParams.get('limit');
        const offset = searchParams.get('offset');

        if (!employeeId) {
            return NextResponse.json(
                { error: 'Employee ID is required' }, 
                { status: 400 }
            );
        }

        let query = `
            SELECT 
                session_id, 
                employee_id, 
                start_time, 
                end_time, 
                total_time, 
                status
            FROM employee_time_tracking
            WHERE employee_id = $1 
            AND status = 'completed'
        `;

        const queryParams = [employeeId];
        let paramIndex = 2;

        if (startDate && endDate) {
            query += ` AND start_time BETWEEN $${paramIndex}::date AND $${paramIndex + 1}::date`;
            queryParams.push(startDate, endDate);
            paramIndex += 2;
        }

        query += ` ORDER BY start_time DESC`;

        if (limit) {
            query += ` LIMIT $${paramIndex}`;
            queryParams.push(limit);
            paramIndex++;
        }
        if (offset) {
            query += ` OFFSET $${paramIndex}`;
            queryParams.push(offset);
        }

        const result = await pool.query(query, queryParams);

        // Ensure we always return an array, even if empty
        const formattedEntries = (result.rows || []).map((entry: any) => ({
            id: entry.session_id,
            loginDate: entry.start_time.toISOString().split('T')[0],
            startTime: entry.start_time.toISOString(),
            endTime: entry.end_time.toISOString(),
            totalSeconds: Number(entry.total_time) || 0
        }));

        return NextResponse.json(formattedEntries);

    } catch (error) {
        console.error('Error fetching time entries:', error);
        return NextResponse.json(
            [], 
            { status: 500 }
        );
    }
}
