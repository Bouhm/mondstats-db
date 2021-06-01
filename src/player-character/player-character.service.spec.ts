import { Test, TestingModule } from '@nestjs/testing';
import { PlayerCharacterService } from './player-character.service';

describe('PlayerCharacterService', () => {
  let service: PlayerCharacterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerCharacterService],
    }).compile();

    service = module.get<PlayerCharacterService>(PlayerCharacterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
