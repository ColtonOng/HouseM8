import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.groceryItem.findMany({
    include: { addedBy: true },
    orderBy: [{ purchased: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, category, estPrice, quantity, addedById } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const item = await prisma.groceryItem.create({
    data: {
      name: name.trim(),
      category: category?.trim() || "Other",
      estPrice: Number(estPrice) || 0,
      quantity: Number(quantity) || 1,
      addedById: addedById || null,
    },
    include: { addedBy: true },
  });

  return NextResponse.json(item, { status: 201 });
}
