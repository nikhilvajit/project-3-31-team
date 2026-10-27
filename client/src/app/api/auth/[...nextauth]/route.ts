import NextAuth from "next-auth/next";
import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { pool } from "../../../../lib/db";

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        // First check if the email exists
        const existingUser = await pool.query(
          'SELECT employee_id FROM employee WHERE email = $1',
          [user.email]
        );
        let employeeId;
        if (existingUser.rows.length > 0) {
          // If user exists, use their existing employee_id
          employeeId = existingUser.rows[0].employee_id;
        } else {
          // If user doesn't exist, create new account
          employeeId = Math.floor(Math.random() * 100000);
          await pool.query(
            'INSERT INTO employee (employee_id, name, email, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING employee_id',
            [employeeId, user.name, user.email, 'cashier', true]
          );
        }
        // Store employeeId in user object for jwt callback
        user.employeeId = employeeId.toString();
        // Get and store role
        const roleResult = await pool.query(
          'SELECT role FROM employee WHERE employee_id = $1',
          [employeeId]
        );
        const role = roleResult.rows[0]?.role || 'cashier';
        user.role = role;
        return true;
      } catch (error) {
        console.error("Error handling user in database:", error);
        return false;
      }
    },

    async jwt({ token, user}) {
      if (user) {
        token.employeeId = user.employeeId;
        token.role = user.role;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token.employeeId) {
        session.user.employeeId = token.employeeId;
        session.user.role = token.role as string;
      }
      return session;
    },

    // async session({ session, user }) {
    //   if (user.employeeId) {
    //     session.user.employeeId = user.employeeId;
    //   }
    //   return session;
    // },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Named export for POST method
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
