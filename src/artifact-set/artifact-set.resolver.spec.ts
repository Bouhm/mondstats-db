import { Test, TestingModule } from '@nestjs/testing';
import { ArtifactSetResolver } from './artifact-set.resolver';

describe('ArtifactSetResolver', () => {
  let resolver: ArtifactSetResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtifactSetResolver],
    }).compile();

    resolver = module.get<ArtifactSetResolver>(ArtifactSetResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
