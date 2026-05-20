import { Invite } from '../../domain/invite.entity';
import { IInviteRepository } from '../repositories/invite.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonInviteRepository
  extends NdjsonRepository<Invite>
  implements IInviteRepository
{
  async findByCode(code: string): Promise<Invite | null> {
    const all = await this.readAll();
    return all.find((i) => i.code === code) ?? null;
  }

  async findPendingByCreator(userId: string): Promise<Invite[]> {
    return this.findWhere((i) => i.createdByUserId === userId && i.status === 'pending');
  }
}
