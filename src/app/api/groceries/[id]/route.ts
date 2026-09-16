import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.category === "string") data.category = body.category.trim();
  if (body.estPrice !== undefined) data.estPrice = Number(body.estPrice) || 0;
  if (body.quantity !== undefined) data.quantity = Number(body.quantity) || 1;
  if (typeof body.purchased === "boolean") data.purchased = body.purchased;

  const item = await prisma.groceryItem.update({
    where: { id },
    data,
    include: { addedBy: true },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.groceryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
