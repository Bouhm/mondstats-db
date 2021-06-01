import { Test, TestingModule } from '@nestjs/testing';
import { AbyssBattleService } from './abyss-battle.service';

describe('AbyssBattleService', () => {
  let service: AbyssBattleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbyssBattleService],
    }).compile();

    service = module.get<AbyssBattleService>(AbyssBattleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
