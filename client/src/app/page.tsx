"use client";
import Image from 'next/image';
import pandaIcon from '../../public/images/Panda_Express_2014.svg';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTimeTracking } from "@/context/TimeTrackingContext";

const LandingPage: React.FC = () => {
  const { data: session } = useSession();
  const {startTracking } = useTimeTracking();

  if (session) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          backgroundColor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Currently Signed In: {session.user?.name}</Typography>
          <Link href="/cashier" passHref>
            <Button variant="contained" fullWidth sx={{ mt: 2 }}>
              Home
            </Button>
          </Link>
          <Button
            variant="contained"
            fullWidth
            onClick={() => signOut({ callbackUrl: '/' })}
            sx={{ mt: 2, color: "white", backgroundColor: "#2b3137" }}
          >
            Sign Out
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      {/* Image Box */}
      <Box sx={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          priority
          src={pandaIcon}
          alt="Panda Express Logo"
          width={225}
        />
      </Box>

      {/* Welcome message */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="h6">Welcome! Please authenticate. </Typography>
      </Box>

      {/* Login Form */}
      <Box sx={{ width: '35%', borderRadius: 2, mt: 3 }}>
        <Button
          fullWidth
          onClick={() => {
            startTracking(); // start tracking time
            signIn('github', { callbackUrl: '/cashier' }); // sign in with GitHub
          }}
          sx={{ mt: 1, color: "white", backgroundColor: "#2b3137" }}
        >
          Sign in with GitHub
        </Button>
        <Link href="/kiosk" passHref>
          <Button variant="contained" fullWidth sx={{ mt: 2 }}>
            Kiosk (Guest)
          </Button>
        </Link>
        <Link href="/menu" passHref>
          <Button variant="contained" fullWidth sx={{ mt: 2 }}>
            Menu (Guest)
          </Button>
        </Link>
      </Box>
    </Container>
  );
};

export default LandingPage;
