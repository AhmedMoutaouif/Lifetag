require('dotenv').config();
const prisma = require('./prismaClient');

async function test() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No user found in DB");
      return;
    }
    console.log("Creating reclamation for user", user.id);
    const rec = await prisma.reclamation.create({
      data: {
        userId: user.id,
        reason: "Test Reason",
        description: "Test description",
        status: "pending"
      }
    });
    console.log("Success:", rec);
  } catch (error) {
    console.error("Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
