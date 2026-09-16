import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const expenses = await prisma.expense.findMany({
    include: { paidBy: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { description, amount, category, owedPercent, paidById, date } = body;

  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      description: description.trim(),
      amount: Number(amount),
      category: category?.trim() || "General",
      owedPercent: owedPercent !== undefined ? Number(owedPercent) : 50,
      paidById: paidById || null,
      date: date ? new Date(date) : new Date(),
    },
    include: { paidBy: true },
  });

  return NextResponse.json(expense, { status: 201 });
}
