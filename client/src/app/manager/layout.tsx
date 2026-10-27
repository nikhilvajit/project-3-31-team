"use client";
import React, { useState, useEffect } from 'react';
import {List, Tooltip, ListItemButton, ListItemText, Drawer, Container, Typography, TextField, Button, Box, AppBar, IconButton, Toolbar, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { margin } from '@mui/system';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CircularProgress } from '@mui/material';
import { useTimeTracking } from "@/context/TimeTrackingContext";
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const menuWidth = 250;
const appBarHeight = 64;

const formatElapsedTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${padWithZero(hours)}:${padWithZero(minutes)}:${padWithZero(remainingSeconds)}`;
};

const padWithZero = (num: number) => (num < 10 ? `0${num}` : num.toString());

export default function Layout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const { stopTracking, elapsedTime } = useTimeTracking();

    // Separate state variables for each dropdown
    const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);     
 
    const handleProfileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setProfileAnchorEl(event.currentTarget);
    };

    const handleCloseProfile = () => {
        setProfileAnchorEl(null);
    };

    const handleSignOut = async () => {
        await stopTracking();
        localStorage.setItem('firstTimeTrackingDone', 'false');
        await signOut({ callbackUrl: '/' });
    };

    const [menuOpen, setMenuOpen] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session || session.user.role !== 'manager') {
            setLoading(false);
            return;
        }
        setLoading(false);
    }, [session, status]);

    if (loading || status === 'loading') {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!session || session.user.role !== 'manager') {
        return (
            <Box 
                display="flex" 
                flexDirection="column" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="100vh"
                sx={{ backgroundColor: '#f5f5f5' }}
            >
                <Typography variant="h4" color="error" gutterBottom>
                    Access Denied
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    You must be a manager to access this page.
                </Typography>
                <Link href="/" passHref>
                    <Button variant="contained" sx={{ mt: 2 }}>
                        Return to Home
                    </Button>
                </Link>
            </Box>
        );
    }

  return (
    
    <Container disableGutters maxWidth = {false} sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh', // background color for debugging
    }}>
        {/* Header */}
        <AppBar
            position="fixed"
            sx={{
                height: appBarHeight,
                width: menuOpen ? `calc(100% - ${menuWidth}px)` : '100%',
                ml: menuOpen ? `${menuWidth}px` : 0,
                transition: theme => theme.transitions.create(['width', 'ml'], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.standard,
                }),
            }}
        >
            <Toolbar>
                <IconButton
                aria-label="Open drawer"
                sx={{ color: "#ffffff", marginRight: '16px' }}
                onClick={() => setMenuOpen(!menuOpen)}
                >
                {menuOpen ? <ChevronLeftIcon /> : <MenuIcon />}
                </IconButton>
                <Typography variant="h6" component="div" sx={{ color: "#ffffff", flexGrow: 1 }}>
                    Manager Dashboard
                    <Tooltip title={`Elapsed Time: ${formatElapsedTime(elapsedTime)}`} arrow>
                        <Link href="/profile" passHref>
                        <IconButton sx={{ color: "#ffffff", marginLeft: "8px" }}>
                            <AccessTimeIcon />
                        </IconButton>
                        </Link>
                    </Tooltip>
                </Typography>

                <Link href="/kitchen" passHref>
                    <Button sx={{ color: "#ffffff", marginLeft: '16px' }}>Kitchen</Button>
                </Link>
                <Link href="/cashier" passHref>
                    <Button sx={{ color: "#ffffff", marginLeft: '16px' }}>Cashier</Button>
                </Link>
                <Button sx={{ color: "#ffffff", marginLeft: '16px' }}>
                    Manager
                </Button>
                <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleProfileClick}  // Use separate handler for profile
                    sx={{
                        color: "#ffffff"
                    }}
                >
                    <AccountCircle />
                </IconButton>
                <Menu
                    anchorEl={profileAnchorEl}
                    open={Boolean(profileAnchorEl)}
                    onClose={handleCloseProfile}
                >
                    <Link href="/profile" passHref>
                    <MenuItem onClick={handleCloseProfile}>View Profile</MenuItem>
                    </Link>
                    <MenuItem onClick={() => { handleSignOut(); }}>
                    Sign Out
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
        {/* Drawer + Main Content */}
        <div style={{ display: 'flex', height: '100vh'}}>
            {/* Drawer */}
            <Drawer
            variant="permanent"
            anchor="left"
            open={menuOpen}    
            sx={{
                width: menuOpen ? menuWidth : '0%',  // Dynamically change width based on menuOpen
                flexShrink: 0,
                transition: theme => theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.standard,
                }),
            }}
            PaperProps={{
                sx: {
                    width: menuOpen ? menuWidth : '0%',  // Dynamically change width based on menuOpen
                    transition: theme => theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.standard,
                    }),
                }
            }}
            >
                <List>
                    <Link href="/manager/trends" passHref>
                        <ListItemButton>
                        <div style={{ pointerEvents: 'none' }}>
                            <IconButton>
                                <TimelineIcon />
                            </IconButton>
                        </div>
                            <ListItemText primary="Trends" />
                        </ListItemButton>
                    </Link>
                    <Link href="/manager/orderhistory" passHref>
                        <ListItemButton>
                            <div style={{ pointerEvents: 'none' }}>
                                <IconButton>
                                    <HistoryIcon />
                                </IconButton>
                            </div>
                            <ListItemText primary="Orders" />
                        </ListItemButton>
                    </Link>
                    <Link href="/manager/inventory" passHref>
                        <ListItemButton>
                            <div style={{ pointerEvents: 'none' }}>
                                <IconButton>
                                    <RestaurantIcon />
                                </IconButton>
                            </div>
                            <ListItemText primary="Inventory" />
                        </ListItemButton>
                    </Link>
                    <Link href="/manager/employees" passHref>
                        <ListItemButton>
                            <div style={{ pointerEvents: 'none' }}>
                                <IconButton>
                                    <PeopleAltIcon />
                                </IconButton>
                            </div>
                            <ListItemText primary="Employees" />
                        </ListItemButton>
                    </Link>
                </List>
            </Drawer>
            {/* Main Content */}
            <div
            style={{
                flexGrow: 1,
                marginTop: appBarHeight,
                padding: '16px',
                boxSizing: 'border-box',
                overflow: 'auto',
            }}
            >
                {children}
            </div>
        </div>
    </Container>
  );
};
