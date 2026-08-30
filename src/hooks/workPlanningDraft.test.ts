import { dprTaskTemplates } from '@/constants/dprTasks';
import { isEqualSnapshot } from '@/utils/isEqualSnapshot';
import { blankTasks, normalizeTasks, type PlanTask } from './workPlanningDraft';


function hydratedTasks(overrides: Partial<Record<string, { qty: string; worker: string }>> = {}): PlanTask[] {
  return dprTaskTemplates.map((task) => ({
    ...task,
    qty: overrides[task.id]?.qty ?? '',
    worker: overrides[task.id]?.worker ?? '',
  }));
}

describe('normalizeTasks', () => {
  it('keeps only qty/worker per task id - not the fixed label', () => {
    const tasks: PlanTask[] = [{ id: 'survey', label: 'SURVEY', qty: '5', worker: 'Ramesh' }];
    expect(normalizeTasks(tasks)).toEqual({ survey: { qty: '5', worker: 'Ramesh' } });
  });
});

describe('Work Planning dirty state (normalizeTasks + isEqualSnapshot together)', () => {
  it('an untouched, freshly hydrated form is not dirty', () => {
    const hydrated = hydratedTasks({ survey: { qty: '3', worker: 'Ramesh' } });
    const initialSnapshot = normalizeTasks(hydrated);

    const isDirty = !isEqualSnapshot(normalizeTasks(hydrated), initialSnapshot);
    expect(isDirty).toBe(false);
  });

  it('changing one field makes the form dirty', () => {
    const hydrated = hydratedTasks({ survey: { qty: '3', worker: 'Ramesh' } });
    const initialSnapshot = normalizeTasks(hydrated);

    const edited = hydrated.map((task) => (task.id === 'survey' ? { ...task, qty: '4' } : task));

    const isDirty = !isEqualSnapshot(normalizeTasks(edited), initialSnapshot);
    expect(isDirty).toBe(true);
  });

  it('reverting a changed field back to its original value clears dirty again', () => {
    const hydrated = hydratedTasks({ survey: { qty: '3', worker: 'Ramesh' } });
    const initialSnapshot = normalizeTasks(hydrated);

    const edited = hydrated.map((task) => (task.id === 'survey' ? { ...task, qty: '4' } : task));
    expect(isEqualSnapshot(normalizeTasks(edited), initialSnapshot)).toBe(false);

    const reverted = edited.map((task) => (task.id === 'survey' ? { ...task, qty: '3' } : task));
    const isDirty = !isEqualSnapshot(normalizeTasks(reverted), initialSnapshot);
    expect(isDirty).toBe(false);
  });

  it('changing 2 of 11 tasks only shows those 2 as different, not the rest', () => {
    const hydrated = hydratedTasks({
      survey: { qty: '3', worker: 'Ramesh' },
      gi: { qty: '1', worker: 'Suresh' },
    });
    const initialSnapshot = normalizeTasks(hydrated);

    const edited = hydrated.map((task) => {
      if (task.id === 'survey') return { ...task, qty: '5' };
      if (task.id === 'gc') return { ...task, worker: 'Mahesh' };
      return task;
    });
    const editedSnapshot = normalizeTasks(edited);

    expect(isEqualSnapshot(editedSnapshot, initialSnapshot)).toBe(false);

    const changedIds = dprTaskTemplates
      .map((task) => task.id)
      .filter((id) => !isEqualSnapshot(editedSnapshot[id], initialSnapshot[id]));
    expect(changedIds.sort()).toEqual(['gc', 'survey']);
  });

  it('a quantity of "0" is a real value, distinct from blank, and does not create a false dirty state', () => {
    const hydrated = hydratedTasks({ survey: { qty: '0', worker: '' } });
    const initialSnapshot = normalizeTasks(hydrated);

    const untouched = hydratedTasks({ survey: { qty: '0', worker: '' } });
    expect(isEqualSnapshot(normalizeTasks(untouched), initialSnapshot)).toBe(true);

    const cleared = hydrated.map((task) => (task.id === 'survey' ? { ...task, qty: '' } : task));
    expect(isEqualSnapshot(normalizeTasks(cleared), initialSnapshot)).toBe(false);
  });

  it('a blank, never-planned form is not dirty against itself', () => {
    const blank = blankTasks();
    expect(isEqualSnapshot(normalizeTasks(blank), normalizeTasks(blankTasks()))).toBe(true);
  });
});
