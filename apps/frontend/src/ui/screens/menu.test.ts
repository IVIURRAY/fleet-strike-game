import { describe, expect, it } from 'vitest';

import {
  createConnectingScreen,
  createMenuScreen,
  createResultScreen,
  createWaitingScreen,
  setMenuError,
} from './menu';

function menu(): {
  screen: HTMLElement;
  created: string[];
  joined: Array<{ code: string; name: string }>;
} {
  const created: string[] = [];
  const joined: Array<{ code: string; name: string }> = [];
  const screen = createMenuScreen({
    onCreateRoom: (name) => created.push(name),
    onJoinRoom: (code, name) => joined.push({ code, name }),
  });
  return { screen, created, joined };
}

function input(screen: HTMLElement, id: string): HTMLInputElement {
  const element = screen.querySelector<HTMLInputElement>(`#${id}`);
  if (element === null) throw new Error(`missing #${id}`);
  return element;
}

function click(screen: HTMLElement, id: string): void {
  screen.querySelector<HTMLButtonElement>(`#${id}`)?.click();
}

describe('createMenuScreen', () => {
  it('renders the name field, create button and join controls', () => {
    const { screen } = menu();
    expect(screen.querySelector('#player-name')).not.toBeNull();
    expect(screen.querySelector('#create-room')).not.toBeNull();
    expect(screen.querySelector('#room-code')).not.toBeNull();
    expect(screen.querySelector('#join-room')).not.toBeNull();
  });

  it('creates a room with the typed name', () => {
    const { screen, created } = menu();
    input(screen, 'player-name').value = 'Ada';
    click(screen, 'create-room');
    expect(created).toEqual(['Ada']);
  });

  it('creates a room with an empty name, letting the server default it', () => {
    const { screen, created } = menu();
    click(screen, 'create-room');
    expect(created).toEqual(['']);
  });

  it('joins with a valid code', () => {
    const { screen, joined } = menu();
    input(screen, 'player-name').value = 'Grace';
    input(screen, 'room-code').value = 'ABCDEF';
    click(screen, 'join-room');
    expect(joined).toEqual([{ code: 'ABCDEF', name: 'Grace' }]);
  });

  it('normalises a lowercase code before joining', () => {
    const { screen, joined } = menu();
    input(screen, 'room-code').value = 'abcdef';
    click(screen, 'join-room');
    expect(joined[0]?.code).toBe('ABCDEF');
  });

  it('rejects a malformed code and explains why', () => {
    const { screen, joined } = menu();
    input(screen, 'room-code').value = 'ABC';
    click(screen, 'join-room');

    expect(joined).toHaveLength(0);
    expect(screen.querySelector('#menu-error')?.textContent).toMatch(/6 characters/i);
  });

  it('rejects a code containing ambiguous characters', () => {
    const { screen, joined } = menu();
    // The room alphabet excludes I, O, 0 and 1.
    input(screen, 'room-code').value = 'ABCDE1';
    click(screen, 'join-room');
    expect(joined).toHaveLength(0);
  });

  it('uppercases the code field as the player types', () => {
    const { screen } = menu();
    const field = input(screen, 'room-code');
    field.value = 'abc';
    field.dispatchEvent(new Event('input'));
    expect(field.value).toBe('ABC');
  });

  it('joins when Enter is pressed in the code field', () => {
    const { screen, joined } = menu();
    const field = input(screen, 'room-code');
    field.value = 'ABCDEF';
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(joined).toHaveLength(1);
  });

  it('does not join on other keys', () => {
    const { screen, joined } = menu();
    const field = input(screen, 'room-code');
    field.value = 'ABCDEF';
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(joined).toHaveLength(0);
  });

  it('clears a previous error on a successful action', () => {
    const { screen } = menu();
    input(screen, 'room-code').value = 'BAD';
    click(screen, 'join-room');
    expect(screen.querySelector('#menu-error')?.textContent).not.toBe('');

    input(screen, 'room-code').value = 'ABCDEF';
    click(screen, 'join-room');
    expect(screen.querySelector('#menu-error')?.textContent).toBe('');
  });
});

describe('setMenuError', () => {
  it('writes a message into the error slot', () => {
    const { screen } = menu();
    setMenuError(screen, 'Server unreachable');
    expect(screen.querySelector('#menu-error')?.textContent).toBe('Server unreachable');
  });

  it('is a no-op on a screen without an error slot', () => {
    expect(() => setMenuError(createConnectingScreen(), 'ignored')).not.toThrow();
  });
});

describe('createWaitingScreen', () => {
  it('shows the room code', () => {
    const screen = createWaitingScreen('QWERTY', () => {});
    expect(screen.querySelector('#waiting-code')?.textContent).toBe('QWERTY');
  });

  it('invokes the cancel handler', () => {
    let cancelled = 0;
    const screen = createWaitingScreen('QWERTY', () => {
      cancelled += 1;
    });
    screen.querySelector<HTMLButtonElement>('#cancel-wait')?.click();
    expect(cancelled).toBe(1);
  });

  it('escapes the code rather than injecting markup', () => {
    const screen = createWaitingScreen('<img src=x>', () => {});
    expect(screen.querySelector('img')).toBeNull();
  });
});

describe('createResultScreen', () => {
  it('shows the headline and detail', () => {
    const screen = createResultScreen('Victory', 'Total planetary conquest.', () => {});
    expect(screen.querySelector('#result-headline')?.textContent).toBe('Victory');
    expect(screen.querySelector('#result-detail')?.textContent).toBe('Total planetary conquest.');
  });

  it('invokes the rematch handler', () => {
    let clicked = 0;
    const screen = createResultScreen('Defeat', 'detail', () => {
      clicked += 1;
    });
    screen.querySelector<HTMLButtonElement>('#rematch')?.click();
    expect(clicked).toBe(1);
  });

  it('escapes untrusted text', () => {
    const screen = createResultScreen('<b>x</b>', '<i>y</i>', () => {});
    expect(screen.querySelector('b')).toBeNull();
    expect(screen.querySelector('i')).toBeNull();
  });
});

describe('createConnectingScreen', () => {
  it('renders a panel', () => {
    const screen = createConnectingScreen();
    expect(screen.classList.contains('panel-backdrop')).toBe(true);
    expect(screen.querySelector('.panel')).not.toBeNull();
  });
});
