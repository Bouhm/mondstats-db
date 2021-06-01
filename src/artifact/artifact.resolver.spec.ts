import { Test, TestingModule } from '@nestjs/testing';
import { ArtifactResolver } from './artifact.resolver';

describe('ArtifactResolver', () => {
  let resolver: ArtifactResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtifactResolver],
    }).compile();

    resolver = module.get<ArtifactResolver>(ArtifactResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
