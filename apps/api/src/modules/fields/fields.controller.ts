import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FieldsService } from './fields.service';

@ApiTags('Taxonomy & Fields')
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  @ApiOperation({
    summary: 'List taxonomy fields',
    description: 'Retrieves all administrator-approved active fields along with subcategories and skills.',
  })
  @ApiResponse({ status: 200, description: 'List of active taxonomy fields' })
  async getFields() {
    return this.fieldsService.findAll();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get field details by slug',
    description: 'Retrieves single taxonomy field with associated categories, skills, and learning paths.',
  })
  @ApiParam({ name: 'slug', description: 'Field URL slug (e.g., software-development)' })
  @ApiResponse({ status: 200, description: 'Field details' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async getFieldBySlug(@Param('slug') slug: string) {
    return this.fieldsService.findBySlug(slug);
  }
}
