import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const people = await prisma.person.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(people);
}
