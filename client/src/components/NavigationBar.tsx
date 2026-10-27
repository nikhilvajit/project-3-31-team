"use client";
import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTimeTracking } from "@/context/TimeTrackingContext";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useSession, signOut } from 'next-auth/react';


const formatElapsedTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${padWithZero(hours)}:${padWithZero(minutes)}:${padWithZero(remainingSeconds)}`;
};

const padWithZero = (num: number) => (num < 10 ? `0${num}` : num.toString());

const NavigationBar: React.FC = () => {
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const { data: session } = useSession();
  const { stopTracking, startTracking,elapsedTime } = useTimeTracking();

  const handleSignOut = async () => {
    await stopTracking();
    localStorage.setItem('firstTimeTrackingDone', 'false');
    await signOut({ callbackUrl: '/' });
};

  const handleProfileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleCloseProfile = () => {
    setProfileAnchorEl(null);
  };

  const pathname = usePathname();

  const getTitle = () => {
    switch (pathname) {
      case "/menu":
        return "Menu View";
      case "/kitchen":
        return "Kitchen View";
      case "/cashier":
        return "Cashier View";
      case "/manager/trends":
        return "Manager Dashboard";
      case "/profile":
        return "Profile View";
      default:
        return "Dashboard";
    }
  };

  return (
    <AppBar position="fixed" sx={{ height: "64px", width: "100%" }}>
      <Toolbar>
        {/* <Button onClick={stopTracking}>StopTracking</Button> 
        <Button onClick={startTracking}>StartTracking</Button> */}
        <Typography variant="h6" component="div" sx={{ color: "#ffffff", flexGrow: 1 }}>
          {getTitle()}
          <Tooltip title={`Elapsed Time: ${formatElapsedTime(elapsedTime)}`} arrow>
            <Link href="/profile" passHref>
              <IconButton sx={{ color: "#ffffff", marginLeft: "8px" }}>
                <AccessTimeIcon />
              </IconButton>
            </Link>
          </Tooltip>
        </Typography>
        <Link href="/kitchen" passHref>
          <Button sx={{ color: "#ffffff", marginLeft: "16px" }}>Kitchen</Button>
        </Link>
        <Link href="/cashier" passHref>
          <Button sx={{ color: "#ffffff", marginLeft: "16px" }}>Cashier</Button>
        </Link>
        {session?.user?.role === 'manager' && (
          <Link href="/manager/trends" passHref>
            <Button sx={{ color: "#ffffff", marginLeft: "16px" }}>Manager</Button>
          </Link>
        )}
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleProfileClick}
          sx={{ color: "#ffffff" }}
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
          <MenuItem onClick={() => { handleCloseProfile(); handleSignOut(); }}>
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;
