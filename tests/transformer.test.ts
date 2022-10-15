import { describe, expect, test } from '@jest/globals';
import { dynamodbRecord } from '../index';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

describe('dynamodb record transform', () => {
  test('transform the accessible properties into dynamodb records', () => {
    class Clazz {
      constructor(
        public publicNum: number,
        readonly readonlyNum: number,
        readonly string: string,
        readonly bytes: Uint8Array,
        readonly bool: boolean,
        readonly nil: unknown,
        readonly stringSlice: string[],
        readonly stringArray: Array<string>,
        readonly numSet: Set<number>,
        readonly stringSet: Set<string>,
        readonly bytesSet: Set<Uint8Array>,
        readonly mapToNum: Map<string, number>,
        readonly mapToString: Map<string, string>,
        readonly mapToBytes: Map<string, Uint8Array>,
        readonly mapToBool: Map<string, boolean>,
        readonly mapToNull: Map<string, unknown>,
        readonly kvMapToNum: { [key: string]: number },
        readonly kvMapToString: { [key: string]: string },
        readonly kvMapToBytes: { [key: string]: Uint8Array },
        readonly kvMapToBool: { [key: string]: boolean },
        readonly kvMapToNull: { [key: string]: unknown },
      ) {}
    }

    const record: Record<string, AttributeValue> = dynamodbRecord<Clazz>(
      new Clazz(
        123,
        234,
        'str',
        new TextEncoder().encode('bytes'),
        true,
        null,
        ['slice', 'str'],
        new Array<string>('array', 'str'),
        new Set<number>([123, 234]),
        new Set<string>(['set', 'str']),
        new Set<Uint8Array>([new TextEncoder().encode('set'), new TextEncoder().encode('bytes')]),
        new Map<string, number>([
          ['mapTo', 123],
          ['num', 234],
        ]),
        new Map<string, string>([
          ['mapTo', 'foo'],
          ['str', 'bar'],
        ]),
        new Map<string, Uint8Array>([
          ['mapTo', new TextEncoder().encode('foo')],
          ['bytes', new TextEncoder().encode('bar')],
        ]),
        new Map<string, boolean>([
          ['mapTo', true],
          ['bool', false],
        ]),
        new Map<string, unknown>([
          ['mapTo', 'foo'],
          ['null', null],
        ]),
        {
          kvMapTo: 123,
          num: 234,
        },
        { kvMapTo: 'foo', str: 'bar' },
        {
          kvMapTo: new TextEncoder().encode('foo'),
          bytes: new TextEncoder().encode('bar'),
        },
        {
          kvMapTo: true,
          bool: false,
        },
        {
          kvMapTo: 'foo',
          null: null,
        },
      ),
    );

    expect(Object.keys(record)).toHaveLength(21);
    expect(record['publicNum']).toEqual({ N: '123' });
    expect(record['readonlyNum']).toEqual({ N: '234' });
    expect(record['string']).toEqual({ S: 'str' });
    expect(record['bytes']).toEqual({ B: new TextEncoder().encode('bytes') });
    expect(record['bool']).toEqual({ BOOL: true });
    expect(record['nil']).toEqual({ NULL: true });
    expect(record['stringSlice']).toEqual({ L: [{ S: 'slice' }, { S: 'str' }] });
    expect(record['stringArray']).toEqual({ L: [{ S: 'array' }, { S: 'str' }] });
    expect(record['numSet']).toEqual({ NS: ['123', '234'] });
    expect(record['stringSet']).toEqual({ SS: ['set', 'str'] });
    expect(record['bytesSet']).toEqual({ BS: [new TextEncoder().encode('set'), new TextEncoder().encode('bytes')] });
    expect(record['mapToNum']).toEqual({
      M: {
        mapTo: {
          N: '123',
        },
        num: {
          N: '234',
        },
      },
    });
    expect(record['mapToString']).toEqual({
      M: {
        mapTo: {
          S: 'foo',
        },
        str: {
          S: 'bar',
        },
      },
    });
    expect(record['mapToBytes']).toEqual({
      M: {
        mapTo: {
          B: new TextEncoder().encode('foo'),
        },
        bytes: {
          B: new TextEncoder().encode('bar'),
        },
      },
    });
    expect(record['mapToBool']).toEqual({
      M: {
        mapTo: {
          BOOL: true,
        },
        bool: {
          BOOL: false,
        },
      },
    });
    expect(record['mapToNull']).toEqual({
      M: {
        mapTo: {
          NULL: false,
        },
        null: {
          NULL: true,
        },
      },
    });
    expect(record['kvMapToNum']).toEqual({
      M: {
        kvMapTo: {
          N: '123',
        },
        num: {
          N: '234',
        },
      },
    });
    expect(record['kvMapToString']).toEqual({
      M: {
        kvMapTo: {
          S: 'foo',
        },
        str: {
          S: 'bar',
        },
      },
    });
    expect(record['kvMapToBytes']).toEqual({
      M: {
        kvMapTo: {
          B: new TextEncoder().encode('foo'),
        },
        bytes: {
          B: new TextEncoder().encode('bar'),
        },
      },
    });
    expect(record['kvMapToBool']).toEqual({
      M: {
        kvMapTo: {
          BOOL: true,
        },
        bool: {
          BOOL: false,
        },
      },
    });
    expect(record['kvMapToNull']).toEqual({
      M: {
        kvMapTo: {
          NULL: false,
        },
        null: {
          NULL: true,
        },
      },
    });
  });

  test('no transform when there is no exposed property', () => {
    class Clazz {
      // @ts-ignore noUnusedLocals
      constructor(private privateString: string, justArgument: string) {}
    }

    const record: Record<string, AttributeValue> = dynamodbRecord<Clazz>(new Clazz('foo', 'bar'));
    expect(Object.keys(record)).toHaveLength(0);
  });
});
