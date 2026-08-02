import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
export * from '@prisma/client';

export * from './lib/placeholders';
export * from './lib/location';
export * from './lib/slug';
export * from './lib/session';
