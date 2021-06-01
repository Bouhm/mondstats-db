import { Test, TestingModule } from '@nestjs/testing';
import { PlayerCharacterResolver } from './player-character.resolver';

describe('PlayerCharacterResolver', () => {
  let resolver: PlayerCharacterResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerCharacterResolver],
    }).compile();

    resolver = module.get<PlayerCharacterResolver>(PlayerCharacterResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
