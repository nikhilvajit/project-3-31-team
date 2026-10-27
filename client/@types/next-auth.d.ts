import 'next-auth';
import { JWT } from 'next-auth/jwt';
declare module 'next-auth' {
  interface Session {
    user: DefaultSession["user"] & {
      employeeId: string;
      role: string;
    };
  }

  interface User {
    employeeId?: string;
    role?: string;
  }

}


