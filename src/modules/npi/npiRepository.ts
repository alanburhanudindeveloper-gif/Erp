import type { NpiProject } from '../../types';
import { createErpCollectionRepository, type ErpCollectionRepository } from '../../infrastructure/database/repositories/erpCollectionRepository';
import { INITIAL_NPI_PROJECTS } from '../../lib/mockData';

export interface INpiRepository {
  listProjects(): NpiProject[];
  findProjectById(id: string): NpiProject | undefined;
  saveProject(project: NpiProject): NpiProject;
  deleteProject(id: string): boolean;
}

export function createNpiRepository(
  initialProjects: NpiProject[] = INITIAL_NPI_PROJECTS
): INpiRepository {
  const npiCollection: ErpCollectionRepository<NpiProject> = createErpCollectionRepository<NpiProject>(
    'npiprojects',
    initialProjects
  );

  return {
    listProjects: () => npiCollection.list(),
    findProjectById: (id: string) => npiCollection.get(id),
    saveProject: (project: NpiProject) => npiCollection.upsert(project, 'id'),
    deleteProject: (id: string) => npiCollection.remove(id),
  };
}
