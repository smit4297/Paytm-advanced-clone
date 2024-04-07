import { getServerSession } from "next-auth"
import { NextResponse } from "next/server";
import { authOptions } from "../../lib/auth";

export const GET = async () => {
  const session = await getServerSession(authOptions);

  // Option 1: Using type guard
  if (session && session.user) {
    return NextResponse.json({ user: session.user });
  }

  // Option 2: Using optional chaining
  if (session?.user) {
    return NextResponse.json({ user: session.user });
  }

  return NextResponse.json({ message: "You are not logged in" }, { status: 403 });
}