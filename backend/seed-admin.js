require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcryptjs');
const prisma = require('./prismaClient');

async function main() {
    const adminEmail = 'admin@lifetag.com';
    const adminPassword = 'adminPassword123!';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            role: 'admin'
        },
        create: {
            name: 'Admin LifeTag',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        }
    });

    console.log('Admin user ready!');
    console.log('--- Credentials ---');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role: ${admin.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
