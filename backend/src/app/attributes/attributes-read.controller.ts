import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttributesService } from './attributes.service';

@Controller('attributes')
@UseGuards(JwtAuthGuard)
export class AttributesReadController {
	constructor(private readonly attributesService: AttributesService) {}

	@Get('catalog')
	async getCatalog() {
		return this.attributesService.getAdminCatalog();
	}
}
