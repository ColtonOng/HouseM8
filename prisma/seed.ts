import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.person.upsert({
    where: { name: "Colton" },
    update: {},
    create: { name: "Colton", color: "ocean" },
  });
  await prisma.person.upsert({
    where: { name: "Anna" },
    update: {},
    create: { name: "Anna", color: "coral" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
