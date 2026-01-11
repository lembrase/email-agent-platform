import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Email } from './email.entity';

export enum EmailProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  IMAP = 'imap',
}

@Entity('email_accounts')
export class EmailAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.emailAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  emailAddress: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({
    type: 'enum',
    enum: EmailProvider,
    default: EmailProvider.IMAP,
  })
  provider: EmailProvider;

  // IMAP Configuration
  @Column({ nullable: true })
  imapServer?: string;

  @Column({ type: 'int', nullable: true })
  imapPort?: number;

  @Column({ nullable: true })
  imapUsername?: string;

  @Column({ type: 'bytea', nullable: true })
  imapPassword?: Buffer; // Encrypted

  // SMTP Configuration
  @Column({ nullable: true })
  smtpServer?: string;

  @Column({ type: 'int', nullable: true })
  smtpPort?: number;

  @Column({ nullable: true })
  smtpUsername?: string;

  @Column({ type: 'bytea', nullable: true })
  smtpPassword?: Buffer; // Encrypted

  // OAuth2 Configuration (for Gmail/Outlook)
  @Column({ type: 'bytea', nullable: true })
  accessToken?: Buffer; // Encrypted

  @Column({ type: 'bytea', nullable: true })
  refreshToken?: Buffer; // Encrypted

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;

  // Processing settings
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  autoProcess: boolean;

  @Column({ default: 15 })
  processIntervalMinutes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt?: Date;

  @OneToMany(() => Email, (email) => email.emailAccount)
  emails: Email[];
}