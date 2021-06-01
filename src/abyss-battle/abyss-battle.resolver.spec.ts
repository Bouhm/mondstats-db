import { Test, TestingModule } from '@nestjs/testing';

import { AbyssBattleResolver } from './abyss-battle.resolver';

describe('AbyssBattleResolver', () => {
  let resolver: AbyssBattleResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbyssBattleResolver],
    }).compile();

    resolver = module.get<AbyssBattleResolver>(AbyssBattleResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
