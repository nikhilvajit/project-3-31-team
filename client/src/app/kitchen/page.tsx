"use client";

import React, { useState, useEffect } from "react";
// import removeOrder from '@/pages/api/orders/removeOrder'; // Adjust the path based on your file structure

import {
  Container,
  Button,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Grid2,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Link from "next/link";
import NavigationBar from "@/components/NavigationBar";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CheckIcon from "@mui/icons-material/Check";
import axios from "axios";

interface ApiResponse {
  orders_id: number;
  employee_id: number | null;
  customer_name: string;
  items: string[];
  status: "Pending" | "In Progress" | "Completed" | "Canceled";
  order_time: string;
}

interface Order {
  orders_id: number;
  customerName: string;
  items: string[];
  status: "Pending" | "In Progress" | "Completed" | "Canceled";
  createdTime: number;
}

const Kitchen: React.FC = () => {
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [fadeOutOrders, setFadeOutOrders] = useState<string[]>([]);

  useEffect(() => {
    const fetchOrders = async (): Promise<void> => {
      try {
        const response = await axios.get<ApiResponse[]>("/api/not-completed");
        const ordersWithValidTime = response.data.map((order) => ({
          orders_id: order.orders_id,
          customerName: order.customer_name || 'Guest', // Use the customer_name from the response
          items: order.items || [],
          status: order.status,
          createdTime: Date.parse(order.order_time),
        }));
        setOrders(ordersWithValidTime.slice(0, 50)); // Limit to 50
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };
  
    fetchOrders(); // Initial fetch
    const intervalId = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleProfileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleCloseProfile = () => {
    setProfileAnchorEl(null);
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await axios.put(`/api/orders/${id}`, { status: newStatus });
      if (newStatus === "Completed") {
        setFadeOutOrders((prev) => [...prev, id.toString()]);
        setTimeout(() => {
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order.orders_id !== id)
          );
          setFadeOutOrders((prev) =>
            prev.filter((orderId) => orderId !== id.toString())
          );
        }, 500); // Wait for fade-out animation
      } else if (newStatus === "Canceled") {
        // Call the removeOrder function for Canceled orders
        // await removeOrder(id);
        setFadeOutOrders((prev) => [...prev, id.toString()]);
        setTimeout(() => {
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order.orders_id !== id)
          );
          setFadeOutOrders((prev) =>
            prev.filter((orderId) => orderId !== id.toString())
          );
        }, 500); // Wait for fade-out animation
      
      } else {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orders_id === id
              ? { ...order, status: newStatus as Order["status"] }
              : order
          )
        );
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const formatOrderTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderItems = (items: string[]) => {
    return (
      <ul>
        {items.map((item, index) => {
          if (
            item.startsWith("Bowl:") ||
            item.startsWith("Plate:") ||
            item.startsWith("Bigger Plate:")
          ) {
            const [_, category, mainItem, subItems] = item.match(
              /^(Bowl|Plate|Bigger Plate): (.+?)(?: \((.+)\))?$/
            ) || [];
            return (
              <li key={index}>
                <strong>{category}:</strong>
                {subItems && (
                  <ul style={{ listStyleType: "square", paddingLeft: "20px" }}>
                    {subItems.split(", ").map((subItem, subIndex) => (
                      <li key={subIndex}>{subItem}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }
          return <li key={index}>{item}</li>;
        })}
      </ul>
    );
  };

  return (
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
    {/* AppBar */}
    <NavigationBar />

      {/* Main Content */}
      <div
        style={{
          marginTop: 64, // Adjust for AppBar height
          overflowY: "auto", // Enable scrolling
          height: "calc(100vh - 64px)", // Full height minus AppBar
        }}
      >
        <Container  maxWidth="xl" sx={{ pt: 2 }}>
          <Grid2 container spacing={4} sx={{ mt: 4 }}>
            {orders.map((order) => (
              <Grid2 key={order.orders_id} sx={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{ width: 330, boxShadow: 3, position: "relative" }}
                  className={
                    fadeOutOrders.includes(order.orders_id.toString())
                      ? "fade-out"
                      : ""
                  }
                >
                  <CardContent>
                    <Typography variant="h6" component="div">
                      Order ID: {order.orders_id}
                    </Typography>
                    <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
                      Customer: {order.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created: {formatOrderTime(order.createdTime)}
                    </Typography>
                    <Typography variant="subtitle1" sx={{mb : 1}}>
                      Status: {order.status}
                    </Typography>
                    {renderItems(order.items)}
                  </CardContent>
                  <CardActions sx={{ display: "flex", width: "100%", padding: 0 }}>
                    {order.status === "Pending" && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          handleUpdateStatus(order.orders_id, "In Progress")
                        }
                        sx={{ flex: 1 }}
                      >
                        Start
                      </Button>
                    )}
                    {order.status === "In Progress" && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() =>
                          handleUpdateStatus(order.orders_id, "Completed")
                        }
                        sx={{ flex: 1 }}
                      >
                        <CheckIcon />
                      </Button>
                    )}
                  </CardActions>
                  <IconButton
                    onClick={() =>
                      handleUpdateStatus(order.orders_id, "Canceled")
                    }
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "error.main",
                    }}
                  >
                    <DeleteForeverIcon />
                  </IconButton>
                </Card>
              </Grid2>
            ))}
          </Grid2>
        </Container>
      </div>
    </Container>
  );
};
  
export default Kitchen;