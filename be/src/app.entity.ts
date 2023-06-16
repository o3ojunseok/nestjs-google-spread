import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class App {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('simple-json')
  value: {
    private_key: string;
    client_email: string;
  };

  @Column({ nullable: true })
  sheet_id: string;

  @Column({ default: true })
  firstCall: boolean;
}
