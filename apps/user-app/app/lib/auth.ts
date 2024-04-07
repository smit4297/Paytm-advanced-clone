import db from "@repo/db/client";
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";
import { z } from "zod"; // Import zod for validation

// Define a schema for the user credentials
const credentialsSchema = z.object({
  phone: z.string().min(10).max(10),
  password: z.string().min(8),
});
export const authOptions = {
    providers: [
        CredentialsProvider({
          name: "Credentials",
          credentials: {
            phone: { label: "Phone number", type: "text", placeholder: "1231231231", required: true },
            password: { label: "Password", type: "password", required: true },
          },
          async authorize(credentials: any) {
            // Validate the credentials using zod
            const validatedCredentials = await credentialsSchema.parseAsync(credentials);
    
            // TODO: OTP validation here
    
            const hashedPassword = await bcrypt.hash(validatedCredentials.password, 10);
            const existingUser = await db.user.findFirst({
              where: {
                number: validatedCredentials.phone,
              },
            });
    
            if (existingUser) {
              const passwordValidation = await bcrypt.compare(validatedCredentials.password, existingUser.password);
              if (passwordValidation) {
                return {
                  id: existingUser.id.toString(),
                  name: existingUser.name,
                  email: existingUser.number,
                };
              }
              return null;
            }
    
            try {
              const user = await db.user.create({
                data: {
                  number: validatedCredentials.phone,
                  password: hashedPassword,
                },
              });
              return {
                id: user.id.toString(),
                name: user.name,
                email: user.number,
              };
            } catch (e) {
              console.error(e);
            }
    
            return null;
          },
        }),
      ],
    secret: process.env.JWT_SECRET || "secret",
    callbacks: {
        // TODO: can u fix the type here? Using any is bad
        async session({ token, session }: any) {
            session.user.id = token.sub
            return session
        }
    }
  }
  

  