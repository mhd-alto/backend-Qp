import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'campaign_visits', synchronize: false })
export class CampaignVisitOrmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'visitor_hash', type: 'char', length: 64, nullable: true })
  visitorHash!: string | null;

  @CreateDateColumn({ name: 'visited_at', type: 'timestamptz' })
  visitedAt!: Date;
}
