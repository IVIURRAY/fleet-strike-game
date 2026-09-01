import { describe, expect, it } from 'vitest';

import { MAX_PLAYER_NAME_LENGTH } from '@fleet-strike/config';

import { parseClientMessage, sanitizeName } from './protocol';

describe('parseClientMessage rejection', () => {
  it('rejects malformed JSON', () => {
    const result = parseClientMessage('{not json');
    expect(result.ok).toBe(false);
  });

  it('rejects non-object payloads', () => {
    expect(parseClientMessage('42').ok).toBe(false);
    expect(parseClientMessage('"hello"').ok).toBe(false);
    expect(parseClientMessage('null').ok).toBe(false);
  });

  it('rejects a missing or non-string type', () => {
    expect(parseClientMessage('{}').ok).toBe(false);
    expect(parseClientMessage('{"type":5}').ok).toBe(false);
  });

  it('rejects an unknown type', () => {
    const result = parseClientMessage('{"type":"LAUNCH_NUKE"}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/unknown message type/i);
  });

  it('rejects an oversized frame', () => {
    const huge = JSON.stringify({ type: 'PING', pad: 'x'.repeat(200_000) });
    const result = parseClientMessage(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/too large/i);
  });
});

describe('parseClientMessage room commands', () => {
  it('accepts CREATE_ROOM and defaults a missing name', () => {
    const result = parseClientMessage('{"type":"CREATE_ROOM"}');
    expect(result.ok).toBe(true);
    if (result.ok && result.message.type === 'CREATE_ROOM') {
      expect(result.message.playerName).toBe('Captain');
    }
  });

  it('accepts JOIN_ROOM with a code', () => {
    const result = parseClientMessage('{"type":"JOIN_ROOM","code":"ABCDEF","playerName":"Ada"}');
    expect(result.ok).toBe(true);
    if (result.ok && result.message.type === 'JOIN_ROOM') {
      expect(result.message.code).toBe('ABCDEF');
      expect(result.message.playerName).toBe('Ada');
    }
  });

  it('rejects JOIN_ROOM without a string code', () => {
    expect(parseClientMessage('{"type":"JOIN_ROOM","code":123}').ok).toBe(false);
  });

  it('accepts LEAVE_ROOM', () => {
    expect(parseClientMessage('{"type":"LEAVE_ROOM"}').ok).toBe(true);
  });

  it('accepts PING and defaults a missing timestamp', () => {
    const result = parseClientMessage('{"type":"PING"}');
    expect(result.ok).toBe(true);
    if (result.ok && result.message.type === 'PING') {
      expect(result.message.sentAt).toBe(0);
    }
  });
});

describe('parseClientMessage in-match commands', () => {
  it('accepts a valid waypoint', () => {
    const result = parseClientMessage('{"type":"SET_WAYPOINT","x":100,"y":200}');
    expect(result.ok).toBe(true);
    if (result.ok && result.message.type === 'SET_WAYPOINT') {
      expect(result.message.x).toBe(100);
    }
  });

  it('rejects non-numeric or non-finite waypoints', () => {
    expect(parseClientMessage('{"type":"SET_WAYPOINT","x":"100","y":200}').ok).toBe(false);
    expect(parseClientMessage('{"type":"SET_WAYPOINT","x":null,"y":200}').ok).toBe(false);
    // JSON has no Infinity literal, so NaN arrives as null.
    expect(parseClientMessage('{"type":"SET_WAYPOINT","y":200}').ok).toBe(false);
  });

  it('accepts a build command and normalises a missing moonId', () => {
    const result = parseClientMessage(
      '{"type":"BUILD_STRUCTURE","planetIndex":0,"buildingType":"scoutFactory"}'
    );
    expect(result.ok).toBe(true);
    if (result.ok && result.message.type === 'BUILD_STRUCTURE') {
      expect(result.message.moonId).toBeNull();
      expect(result.message.planetIndex).toBe(0);
    }
  });

  it('preserves a supplied moonId', () => {
    const result = parseClientMessage(
      '{"type":"BUILD_STRUCTURE","planetIndex":0,"moonId":"home-a-moon-1","buildingType":"plasmaTurret"}'
    );
    expect(result.ok).toBe(true);
    if (result.ok && result.message.type === 'BUILD_STRUCTURE') {
      expect(result.message.moonId).toBe('home-a-moon-1');
    }
  });

  it('rejects malformed build commands', () => {
    expect(
      parseClientMessage('{"type":"BUILD_STRUCTURE","planetIndex":1.5,"buildingType":"goldMine"}').ok
    ).toBe(false);
    expect(parseClientMessage('{"type":"BUILD_STRUCTURE","planetIndex":0}').ok).toBe(false);
    expect(
      parseClientMessage('{"type":"BUILD_STRUCTURE","planetIndex":0,"buildingType":5}').ok
    ).toBe(false);
    expect(
      parseClientMessage(
        '{"type":"BUILD_STRUCTURE","planetIndex":0,"moonId":7,"buildingType":"goldMine"}'
      ).ok
    ).toBe(false);
  });

  it('accepts an upgrade command', () => {
    const result = parseClientMessage('{"type":"UPGRADE_BUILDING","buildingId":42}');
    expect(result.ok).toBe(true);
  });

  it('rejects malformed upgrade ids', () => {
    expect(parseClientMessage('{"type":"UPGRADE_BUILDING","buildingId":-1}').ok).toBe(false);
    expect(parseClientMessage('{"type":"UPGRADE_BUILDING","buildingId":1.5}').ok).toBe(false);
    expect(parseClientMessage('{"type":"UPGRADE_BUILDING"}').ok).toBe(false);
  });
});

describe('sanitizeName', () => {
  it('falls back for non-strings and blanks', () => {
    expect(sanitizeName(undefined)).toBe('Captain');
    expect(sanitizeName(42)).toBe('Captain');
    expect(sanitizeName('   ')).toBe('Captain');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeName('  Ada  ')).toBe('Ada');
  });

  it('strips control characters that would corrupt the HUD', () => {
    expect(sanitizeName('Ada\u0000\u001bLovelace')).toBe('AdaLovelace');
  });

  it('caps the length', () => {
    const name = sanitizeName('x'.repeat(500));
    expect(name).toHaveLength(MAX_PLAYER_NAME_LENGTH);
  });

  it('keeps ordinary names intact', () => {
    expect(sanitizeName('Commander Shepard')).toBe('Commander Shepard');
  });
});
