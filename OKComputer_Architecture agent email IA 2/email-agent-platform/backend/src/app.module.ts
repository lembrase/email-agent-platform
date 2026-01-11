import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailsModule } from './emails/emails.module';
import { DocumentsModule } from './documents/documents.module';

// Entities
import { User } from './users/entities/user.entity';
import { Organization } from './users/entities/organization.entity';
import { EmailAccount } from './emails/entities/email-account.entity';
import { Email } from './emails/entities/email.entity';
import { Document } from './documents/entities/document.entity';
import { Classification } from './documents/entities/classification.entity';
import { AuditLog } from './common/entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'emailagent'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'emailagent'),
        entities: [
          User,
          Organization,
          EmailAccount,
          Email,
          Document,
          Classification,
          AuditLog,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),
    
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    
    ScheduleModule.forRoot(),
    
    // Feature modules
    AuthModule,
    UsersModule,
    EmailsModule,
    DocumentsModule,
  ],
})
export class AppModule {}