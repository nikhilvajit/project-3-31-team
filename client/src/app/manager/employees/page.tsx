"use client";
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Define the Employee interface
interface Employee {
  id?: string | number;
  name: string;
  email?: string;
  role: 'cashier' | 'manager';
  hours?: string;
  completed_orders?: string;
  order_statuses?: string;
}

const Employees = () => {
  // States for the dialogs and employee data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [openAddEmployeeDialog, setOpenAddEmployeeDialog] = useState(false);
  const [openRemoveEmployeeDialog, setOpenRemoveEmployeeDialog] = useState(false);
  const [openModifyRoleDialog, setOpenModifyRoleDialog] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState<'cashier' | 'manager'>('cashier');
  const [selectedEmployeeToRemove, setSelectedEmployeeToRemove] = useState('');
  const [selectedEmployeeToModify, setSelectedEmployeeToModify] = useState('');
  const [selectedEmployeeModifyRole, setSelectedEmployeeModifyRole] = useState<'cashier' | 'manager'>('cashier');

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        const data: Employee[] = await response.json();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        alert('Failed to load employees');
      }
    };

    fetchEmployees();
  }, []);

  // Functions to handle dialog open/close
  const handleAddEmployeeDialogOpen = () => setOpenAddEmployeeDialog(true);
  const handleAddEmployeeDialogClose = () => {
    setOpenAddEmployeeDialog(false);
    // Reset form fields
    setNewEmployeeName('');
    setNewEmployeeEmail('');
    setNewEmployeeRole('cashier');
  };
  const handleRemoveEmployeeDialogOpen = () => setOpenRemoveEmployeeDialog(true);
  const handleRemoveEmployeeDialogClose = () => {
    setOpenRemoveEmployeeDialog(false);
    setSelectedEmployeeToRemove('');
  };
  const handleModifyRoleDialogOpen = () => setOpenModifyRoleDialog(true);
  const handleModifyRoleDialogClose = () => {
    setOpenModifyRoleDialog(false);
    setSelectedEmployeeToModify('');
    setSelectedEmployeeModifyRole('cashier');
  };

  const handleAddEmployee = async () => {
    // Validate inputs
    if (!newEmployeeName.trim()) {
      alert('Please enter an employee name');
      return;
    }
    
    if (!newEmployeeEmail.trim() || !newEmployeeEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newEmployeeName.trim(), 
          email: newEmployeeEmail.trim(), 
          role: newEmployeeRole
        })
      });

      if (response.ok) {
        const newEmployee: Employee = await response.json();
        setEmployees([...employees, newEmployee]);
        handleAddEmployeeDialogClose();
      } else {
        const errorData = await response.json();
        console.error('Failed to add employee:', errorData);
        alert(`Failed to add employee: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('An error occurred while adding the employee');
    }
  };

  const handleRemoveEmployee = async () => {
    try {
      const response = await fetch('/api/employees', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedEmployeeToRemove
        })
      });

      if (response.ok) {
        setEmployees(employees.filter(emp => emp.name !== selectedEmployeeToRemove));
        handleRemoveEmployeeDialogClose();
      } else {
        const errorData = await response.json();
        console.error('Failed to remove employee:', errorData);
        alert(`Failed to remove employee: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error removing employee:', error);
      alert('An error occurred while removing the employee');
    }
  };

  const handleModifyEmployeeRole = async () => {
    try {
      const response = await fetch('/api/employees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedEmployeeToModify,
          role: selectedEmployeeModifyRole
        })
      });

      if (response.ok) {
        // Update the employees list with the new role
        const updatedEmployees = employees.map(emp => 
          emp.name === selectedEmployeeToModify 
            ? { ...emp, role: selectedEmployeeModifyRole } 
            : emp
        );
        setEmployees(updatedEmployees);
        handleModifyRoleDialogClose();
      } else {
        const errorData = await response.json();
        console.error('Failed to modify employee role:', errorData);
        alert(`Failed to modify employee role: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error modifying employee role:', error);
      alert('An error occurred while modifying employee role');
    }
  };

  // Render employee rows
  const renderEmployeeRows = () => {
    return employees.map((employee) => (
      <TableRow hover role="checkbox" tabIndex={-1} key={`employee-${employee.id}`}>
        <TableCell component="th" scope="row">{employee.name}</TableCell>
        <TableCell>{employee.id}</TableCell>
        <TableCell>{employee.hours || '0'}</TableCell>
        <TableCell>{employee.completed_orders || '0'}</TableCell>
        <TableCell>{employee.role}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Container style={{ width: "98%" }}>
      <Typography variant="h4" style={{ paddingBottom: "16px" }}>
        Employees
      </Typography>

      <div style={{ display: "flex", gap: "16px", paddingBottom: "16px", justifyContent: "left" }}>
        <Button variant="contained" color="success" onClick={handleAddEmployeeDialogOpen} startIcon={<AddCircleIcon />}>
          Add Employee
        </Button>
        <Button variant="contained" color="error" onClick={handleRemoveEmployeeDialogOpen} startIcon={<RemoveCircleIcon />}>
          Remove Employee
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="contained" color="primary" onClick={handleModifyRoleDialogOpen}>
            Modify Employee Role
          </Button>
        </div>
      </div>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="employees table">
          <caption> A table containing employees with employee information</caption>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Hours (Past 7 Days)</TableCell>
              <TableCell>Completed Orders (Past 7 Days)</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderEmployeeRows()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Employee Dialog */}
      <Dialog open={openAddEmployeeDialog} onClose={handleAddEmployeeDialogClose}>
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Email"
            value={newEmployeeEmail}
            onChange={(e) => setNewEmployeeEmail(e.target.value)}
            margin="normal"
            variant="outlined"
            type="email"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={newEmployeeRole}
              onChange={(e) => setNewEmployeeRole(e.target.value as 'cashier' | 'manager')}
              label="Role"
            >
              <MenuItem value="cashier">Cashier</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddEmployeeDialogClose} startIcon={<CancelIcon />} color="error">
            Cancel
          </Button>
          <Button onClick={handleAddEmployee} startIcon={<CheckCircleIcon />} color="success">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Employee Dialog */}
      <Dialog open={openRemoveEmployeeDialog} onClose={handleRemoveEmployeeDialogClose}>
        <DialogTitle>Remove Employee</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Employee</InputLabel>
            <Select
              value={selectedEmployeeToRemove}
              onChange={(e) => setSelectedEmployeeToRemove(e.target.value)}
              label="Select Employee"
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.name}>
                  {employee.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveEmployeeDialogClose} startIcon={<CancelIcon />} color="error">
            Cancel
          </Button>
          <Button onClick={handleRemoveEmployee} startIcon={<CheckCircleIcon />} color="success">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modify Role Dialog */}
      <Dialog open={openModifyRoleDialog} onClose={handleModifyRoleDialogClose}>
        <DialogTitle>Modify Employee Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Employee</InputLabel>
            <Select
              value={selectedEmployeeToModify}
              onChange={(e) => setSelectedEmployeeToModify(e.target.value)}
              label="Select Employee"
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.name}>
                  {employee.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select New Role</InputLabel>
            <Select
              value={selectedEmployeeModifyRole}
              onChange={(e) => setSelectedEmployeeModifyRole(e.target.value as 'cashier' | 'manager')}
              label="Select New Role"
            >
              <MenuItem value="cashier">Cashier</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModifyRoleDialogClose} startIcon={<CancelIcon />} color="error">
            Cancel
          </Button>
          <Button onClick={handleModifyEmployeeRole} startIcon={<CheckCircleIcon />} color="success">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Employees;
