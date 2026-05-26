import { isValidTransition, allowedTransitions } from '../../src/workflow/stateMachine';

describe('stateMachine', () => {
  it('allows todo → in_progress', () => {
    expect(isValidTransition('todo', 'in_progress')).toBe(true);
  });

  it('blocks done → in_progress', () => {
    expect(isValidTransition('done', 'in_progress')).toBe(false);
  });

  it('returns correct allowed transitions for in_progress', () => {
    expect(allowedTransitions('in_progress')).toEqual(['review', 'todo', 'done']);
  });
});
