require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcryptjs');
const prisma = require('./prismaClient');

async function main() {
    const adminEmail = 'ahmed@lifetag.com';
    const adminPassword = 'ahmedPassword123!';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            role: 'admin',
            status: 'active'
        },
        create: {
            name: 'Ahmed Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            status: 'active'
        }
    });

    console.log('✅ New Admin created successfully!');
    console.log('--- ADMIN CREDENTIALS ---');
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
