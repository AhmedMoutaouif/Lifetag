require('dotenv').config();
const prisma = require('./prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
    console.log("Démarrage du peuplement de la base de données...");

    // 1. Création d'un administrateur
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@lifetag.com' },
        update: {},
        create: {
            name: 'Admin LifeTag',
            email: 'admin@lifetag.com',
            password: adminPassword,
            role: 'admin'
        }
    });
    console.log(`- Administrateur créé : ${admin.email}`);

    // 2. Création d'un utilisateur patient avec son historique
    const userPassword = await bcrypt.hash('patient123', 10);
    const patient = await prisma.user.upsert({
        where: { email: 'jean.dupont@exemple.com' },
        update: {},
        create: {
            name: 'Jean Dupont',
            email: 'jean.dupont@exemple.com',
            password: userPassword,
            role: 'user',
            medicalRecords: {
                create: {
                    allergies: 'Pénicilline, Arachides, Piqûre de guêpe',
                    maladies: 'Diabète de type 1, Asthme Sévère',
                    medicaments: 'Insuline Rapide, Ventoline 100µg',
                    bloodGroup: 'O+'
                }
            },
            cards: {
                create: {
                    qrCode: 'LIFETAG_QR_XYZ789',
                    status: 'validated'
                }
            },
            subscriptions: {
                create: {
                    type: 'PREMIUM',
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                }
            }
        }
    });

    console.log(`- Patient test inséré : ${patient.name}`);
    console.log(`- QRCode activé pour le patient : LIFETAG_QR_XYZ789`);
    console.log("Terminé avec succès !");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
