const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "mahasiswa123";
const NIMS = ["10123456", "10123457", "10123458", "10123459"];

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const nim of NIMS) {
    await prisma.student.upsert({
      where: { nim },
      update: {
        passwordHash,
        mustChangePassword: true,
      },
      create: {
        nim,
        passwordHash,
        mustChangePassword: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
