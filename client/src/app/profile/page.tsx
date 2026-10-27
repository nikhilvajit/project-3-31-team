"use client";
import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  Button,
} from "@mui/material";
import { useSession, getSession } from "next-auth/react";
import NavigationBar from "@/components/NavigationBar";

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
}

interface TimeEntry {
  id: number;
  loginDate: string;
  startTime: string;
  endTime: string;
  totalSeconds: number;
}

const Profile: React.FC = () => {
  const { data: session, status, update } = useSession();
  const [hoursData, setHoursData] = useState<ChartData>({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  });

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTimeEntries = async () => {
    if (!session?.user?.employeeId) return;

    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('employeeId', session.user.employeeId);
      
      // Add date filtering if dates are selected
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      // Add pagination
      queryParams.append('limit', String(rowsPerPage));
      queryParams.append('offset', String(page * rowsPerPage));

      const response = await fetch(`/api/time-tracking/entries?${queryParams}`);
      const data = await response.json();

      setTimeEntries(data);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { // make sure that info is fetched before rendering
    const initSession = async () => {
      getSession();
      if (!session?.user?.employeeId) {
        await update();
      }
    };

    if (status === "authenticated") {
      initSession();
    }
  }, [status, session?.user?.employeeId, update]);

  useEffect(() => {
    if (session?.user?.employeeId) {
      fetchTimeEntries();
    }
  }, [session?.user?.employeeId, page, rowsPerPage, startDate, endDate]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchTimeEntries();
  };


  const formatTotalTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
    <Container 
      disableGutters 
      maxWidth={false}
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        height: '100vh',
        overflow: 'hidden',
      }}
    >        
    <NavigationBar />
        <Box sx={{ width: "100%", mt: "64px", px: 5, display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
          <Typography variant="h4" component="h1" sx={{ marginTop: "20px" }}>
            {"Welcome, " + session?.user?.name + "!" || "Employee Name"}
          </Typography>

          {/* Employee ID placeholder */}
          <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: 1, borderBottom: "1px solid lightgray", position: "relative" }}>
            <Typography variant="body1" fontWeight="bold" sx={{ textAlign: "center" }}>
              {session?.user?.employeeId}
            </Typography>
            <Typography variant="body1" sx={{ position: "absolute", left: 0 }}>
              Employee ID:
            </Typography>
          </Box>

          {/* Time Tracking Table */}
          <Box sx={{ width: "100%", mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Time Tracking Log </Typography>
            
            {/* Date Filtering */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField 
                label="Start Date" 
                type="date" 
                InputLabelProps={{ shrink: true }} 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField 
                label="End Date" 
                type="date" 
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button 
                variant="contained" 
                color="success" 
                onClick={handleSearch}
              >
                Search
              </Button>
            </Box>

            <TableContainer component={Paper} sx={{marginBottom: "40px" }}>
              
              <Table sx={{ minWidth: 650}}>
                <TableHead>
                  <TableRow>
                    <TableCell>Login Date</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Total Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow hover
                        key={entry.id}
                      >
                        <TableCell component="th" scope="row">
                          {entry.loginDate}
                        </TableCell>
                        <TableCell>{new Date(entry.startTime).toLocaleTimeString()}</TableCell>
                        <TableCell>{new Date(entry.endTime).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          {formatTotalTime(entry.totalSeconds)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={50} // display last 50 entries
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          </Box>
        </Box>
    </Container>
    </>
  );
};

export default Profile;