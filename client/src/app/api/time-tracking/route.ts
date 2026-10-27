import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { employeeId, action, elapsedTime } = data;

        console.log('Received time tracking request:', { employeeId, action, elapsedTime });

        if (action === 'start') {
            // Start a new tracking session
            const query = `
                INSERT INTO employee_time_tracking 
                (employee_id, start_time, status) 
                VALUES ($1, CURRENT_TIMESTAMP, 'active')
                RETURNING session_id, start_time`;
            const result = await pool.query(query, [employeeId]);
            
            // Check if a row was returned
            if (result.rows.length === 0) {
                console.error('No rows returned when starting time tracking');
                return NextResponse.json({ 
                    error: 'Failed to start time tracking session' 
                }, { status: 500 });
            }

            console.log('Time tracking started:', result.rows[0]);
            
            // Convert timestamps to ISO strings for JSON serialization
            return NextResponse.json({
                session_id: result.rows[0].session_id,
                start_time: result.rows[0].start_time.toISOString()
            });

        } else if (action === 'stop') {
            // Update the session with end time and total time
            const query = `
                UPDATE employee_time_tracking 
                SET end_time = start_time + interval '1 second' * $1,
                    total_time = $1,
                    status = 'completed'
                WHERE employee_id = $2 
                AND status = 'active'
                RETURNING session_id, start_time, end_time, total_time`;
            
            const result = await pool.query(query, [elapsedTime, employeeId]);
            
            // Check if a row was returned
            if (result.rows.length === 0) {
                console.error('No active session found for stopping time tracking');
                return NextResponse.json({ 
                    error: 'No active time tracking session found' 
                }, { status: 404 });
            }

            console.log('Time tracking stopped:', result.rows[0]);
            
            // Convert timestamps to ISO strings for JSON serialization
            return NextResponse.json({
                session_id: result.rows[0].session_id,
                start_time: result.rows[0].start_time.toISOString(),
                end_time: result.rows[0].end_time.toISOString(),
                total_time: result.rows[0].total_time
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Detailed error in time tracking:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process time tracking request',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 
            { status: 500 }
        );
    }
}
