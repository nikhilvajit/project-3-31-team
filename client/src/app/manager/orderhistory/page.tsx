"use client";
import React, { useState, useEffect, MouseEvent } from "react";
import {
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Paper,
  TableContainer,
  Table,
  TableFooter,
  TablePagination,
  Typography,
  TextField,
  Button,
  Container,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import axios from "axios";

// Define the type for order history rows
interface OrderHistoryRow {
  id: number;
  order_id: number;
  date: string;
  contents: string;
  employee: string;
  total: number;
  status: string;
  customer_name: string;
}

// TablePaginationActions component with proper typing
interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0} aria-label="first page">
        <FirstPageIcon />
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="previous page">
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton>
    </Box>
  );
}

const OrderHistory = () => {
  const [rows, setRows] = useState<OrderHistoryRow[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itemFilter, setItemFilter] = useState('');

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (itemFilter) queryParams.append('item', itemFilter);

      const response = await fetch(`/api/order-history?${queryParams}`);
      const data = await response.json();
      
      // Ensure data is an array and has a map method
      const safeData = Array.isArray(data) ? data : [];
      
      // Format date to match original component's date format
      const formattedData: OrderHistoryRow[] = safeData.map((row: any) => ({
        ...row,
        id: row.order_id,
        date: row.date 
          ? new Date(row.date).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
      }));

      setRows(formattedData);
    } catch (error) {
      console.error('Failed to fetch order history:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id: number) => {
    try {
      await axios.delete(`/api/orders/${id}`);
      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    } catch (error) {
      console.error(`Failed to delete order ${id}:`, error);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    fetchOrderHistory();
  };

  const emptyRows = Math.max(0, (1 + page) * rowsPerPage - rows.length);

  return (
    <Container style={{ width: '98%' }}>
      <Typography variant="h4" style={{ paddingBottom: "16px" }}>
        Order History
      </Typography>
      <div
        style={{
          display: "flex",
          gap: "16px",
          paddingBottom: "16px",
          justifyContent: "left",
        }}
      >
        <TextField 
          label="Start Date" 
          type="date" 
          InputLabelProps={{ shrink: true }} 
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <TextField 
          label="Stop Date" 
          type="date" 
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        {/* <TextField 
          label="Item (optional)" 
          type="text" 
          value={itemFilter}
          onChange={(e) => setItemFilter(e.target.value)}
        /> */}
        <Button 
          variant="contained" 
          color="success" 
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="order history table">
            <caption>A table containing past customer orders.</caption>
            <TableHead>
              <TableRow>
                <TableCell align="left">Order ID</TableCell>
                <TableCell align="left">Date</TableCell>
                <TableCell align="left">Order Contents</TableCell>
                <TableCell align="left">Employee</TableCell>
                <TableCell align="left">Total</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : rows
              ).map((row) => (
                <TableRow 
                  hover 
                  role="checkbox" 
                  tabIndex={-1} 
                  key={row.id}
                >
                  <TableCell component="th" scope="row">
                    {row.id}
                  </TableCell>
                  <TableCell align="left">{row.date}</TableCell>
                  <TableCell align="left">{row.contents}</TableCell>
                  <TableCell align="left">{row.employee}</TableCell>
                  <TableCell align="left">{row.total.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      onClick={() => deleteOrder(row.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[10, 20, 50, { label: "All", value: -1 }]}
                  count={rows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default OrderHistory;
