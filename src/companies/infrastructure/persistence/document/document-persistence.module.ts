import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanySchema, CompanySchemaClass } from './entities/company.schema';
import { CompanyRepository } from '../company.repository';
import { CompanyDocumentRepository } from './repositories/company.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanySchemaClass.name, schema: CompanySchema },
    ]),
  ],
  providers: [
    {
      provide: CompanyRepository,
      useClass: CompanyDocumentRepository,
    },
  ],
  exports: [CompanyRepository],
})
export class DocumentCompanyPersistenceModule {}
