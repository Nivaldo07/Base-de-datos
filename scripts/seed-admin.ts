import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Verificando/creando usuario Administrador inicial...');

  const email = 'admin@nutriicbf.gov.co';
  const rawPassword = 'NutriICBF2026*';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const existing = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`ℹ️ El usuario administrador (${email}) ya existe. Actualizando contraseña y rol...`);
    const updated = await prisma.usuario.update({
      where: { email },
      data: {
        nombre: 'Administrador ICBF',
        rol: 'ADMIN',
        activo: true,
        password: hashedPassword,
      },
    });
    console.log('✅ Usuario administrador actualizado:', updated.email, 'Rol:', updated.rol);
  } else {
    const created = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre: 'Administrador ICBF',
        rol: 'ADMIN',
        activo: true,
      },
    });
    console.log('✅ Usuario inicial creado con éxito:', created.email, 'Rol:', created.rol);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en seed-admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
