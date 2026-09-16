import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.category === "string") data.category = body.category.trim();
  if (body.estCost !== undefined) data.estCost = Number(body.estCost) || 0;
  if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;
  if (typeof body.purchased === "boolean") data.purchased = body.purchased;

  const item = await prisma.moveInItem.update({
    where: { id },
    data,
    include: { addedBy: true },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.moveInItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
