import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.field.findMany({
      where: { isActive: true },
      include: {
        categories: {
          include: {
            skills: true,
          },
        },
        _count: {
          select: {
            userFields: true,
            posts: true,
            opportunities: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const field = await this.prisma.field.findUnique({
      where: { slug },
      include: {
        categories: {
          include: {
            skills: true,
          },
        },
        learningPaths: {
          include: {
            milestones: true,
          },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with slug '${slug}' not found.`);
    }

    return field;
  }
}
