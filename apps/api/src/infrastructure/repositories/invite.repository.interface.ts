import { Invite } from '../../domain/invite.entity';
import { IRepository } from './repository.interface';

export interface IInviteRepository extends IRepository<Invite> {
  findByCode(code: string): Promise<Invite | null>;
  findPendingByCreator(userId: string): Promise<Invite[]>;
}
