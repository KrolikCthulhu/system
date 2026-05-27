import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValuesService } from './values.service';

@Controller('values')
@UseGuards(JwtAuthGuard)
export class ValuesReadController {
	constructor(private readonly valuesService: ValuesService) {}

	@Get('catalog')
	async getCatalog() {
		return this.valuesService.getCatalog();
	}
}
