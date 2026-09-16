import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.description === "string") data.description = body.description.trim();
  if (body.amount !== undefined) data.amount = Number(body.amount);
  if (typeof body.category === "string") data.category = body.category.trim();
  if (body.owedPercent !== undefined) data.owedPercent = Number(body.owedPercent);
  if (typeof body.settled === "boolean") data.settled = body.settled;

  const expense = await prisma.expense.update({
    where: { id },
    data,
    include: { paidBy: true },
  });

  return NextResponse.json(expense);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
