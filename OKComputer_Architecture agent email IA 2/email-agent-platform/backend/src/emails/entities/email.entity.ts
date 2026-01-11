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
import { EmailAccount } from './email-account.entity';
import { Document } from '../../documents/entities/document.entity';

export enum EmailPriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

export enum EmailProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EmailAccount, (emailAccount) => emailAccount.emails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emailAccountId' })
  emailAccount: EmailAccount;

  @Column()
  emailAccountId: string;

  @Column({ unique: true })
  messageId: string;

  @Column()
  sender: string;

  @Column({ nullable: true })
  senderName?: string;

  @Column({ type: 'jsonb' })
  recipients: Array<{ email: string; name?: string }>;

  @Column({ type: 'jsonb', nullable: true })
  cc?: Array<{ email: string; name?: string }>;

  @Column({ type: 'jsonb', nullable: true })
  bcc?: Array<{ email: string; name?: string }>;

  @Column()
  subject: string;

  @Column({ type: 'text', nullable: true })
  bodyText?: string;

  @Column({ type: 'text', nullable: true })
  bodyHtml?: string;

  @Column({ type: 'timestamp' })
  receivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({
    type: 'enum',
    enum: EmailPriority,
    default: EmailPriority.NORMAL,
  })
  priority: EmailPriority;

  // AI Analysis
  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  subcategory?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  confidenceScore?: number;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  // Processing
  @Column({
    type: 'enum',
    enum: EmailProcessingStatus,
    default: EmailProcessingStatus.PENDING,
  })
  processingStatus: EmailProcessingStatus;

  @Column({ type: 'text', nullable: true })
  processingError?: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  threadId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Document, (document) => document.email)
  documents: Document[];
}