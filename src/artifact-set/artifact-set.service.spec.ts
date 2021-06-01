import { Test, TestingModule } from '@nestjs/testing';
import { ArtifactSetService } from './artifact-set.service';

describe('ArtifactSetService', () => {
  let service: ArtifactSetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtifactSetService],
    }).compile();

    service = module.get<ArtifactSetService>(ArtifactSetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
