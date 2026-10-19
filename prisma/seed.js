// Creates a demo account with a filled board: npm run db:seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEMO_COLUMNS = {
  "À faire": ["Rédiger le cahier des charges", "Maquetter la page d'accueil", "Choisir l'hébergeur"],
  "En cours": ["Mettre en place l'authentification", "Créer le schéma de base de données"],
  Terminé: ["Initialiser le projet Next.js"],
};

async function main() {
  await prisma.user.deleteMany({ where: { email: "demo@taskflow.dev" } });
  await prisma.workspace.deleteMany({ where: { name: "Espace démo" } });

  await prisma.user.create({
    data: {
      name: "Démo",
      email: "demo@taskflow.dev",
      passwordHash: await bcrypt.hash("demo1234", 10),
      memberships: {
        create: {
          role: "OWNER",
          workspace: {
            create: {
              name: "Espace démo",
              boards: {
                create: {
                  title: "Lancement du site",
                  columns: {
                    create: Object.entries(DEMO_COLUMNS).map(([title, cards], position) => ({
                      title,
                      position,
                      cards: { create: cards.map((cardTitle, i) => ({ title: cardTitle, position: i })) },
                    })),
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  console.log("Compte démo prêt : demo@taskflow.dev / demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
