import { describe, expect, test } from '@jest/globals';
import { fromDynamodbRecord } from '../index';

describe('from dynamodb record transform', () => {
  test('should unmarshal the attributes into arbitrary interface instance', () => {
    interface Interface {
      publicNum: number;
      readonly readonlyNum: number;
      readonly string: string;
      readonly bytes: Uint8Array;
      readonly bool: boolean;
      readonly nil: unknown;
      readonly stringSlice: string[];
      readonly stringArray: Array<string>;
      readonly numSlice: number[];
      readonly numArray: Array<number>;
      readonly numSet: Set<number>;
      readonly stringSet: Set<string>;
      readonly bytesSet: Set<Uint8Array>;
      readonly mapToNum: Map<string, number>;
      readonly mapToString: Map<string, string>;
      readonly mapToBytes: Map<string, Uint8Array>;
      readonly mapToBool: Map<string, boolean>;
      readonly mapToNull: Map<string, unknown>;
      readonly kvMapToNum: { [key: string]: number };
      readonly kvMapToString: { [key: string]: string };
      readonly kvMapToBytes: { [key: string]: Uint8Array };
      readonly kvMapToBool: { [key: string]: boolean };
      readonly kvMapToNull: { [key: string]: unknown };
    }

    const got = fromDynamodbRecord<Interface>(
      {
        publicNum: { N: '123' },
        readonlyNum: { N: '234' },
        string: { S: 'str' },
        bytes: { B: new TextEncoder().encode('bytes') },
        bool: { BOOL: true },
        nil: { NULL: true },
        stringSlice: { L: [{ S: 'slice' }, { S: 'str' }] },
        stringArray: { L: [{ S: 'array' }, { S: 'str' }] },
        numSlice: { L: [{ N: '123' }, { N: '234' }] },
        numArray: { L: [{ N: '345' }, { N: '456' }] },
        numSet: { NS: ['123', '234'] },
        stringSet: { SS: ['set', 'str'] },
        bytesSet: { BS: [new TextEncoder().encode('set'), new TextEncoder().encode('bytes')] },
        mapToNum: {
          M: {
            mapTo: { N: '123' },
            num: {
              N: '234',
            },
          },
        },
        mapToString: {
          M: {
            mapTo: {
              S: 'foo',
            },
            str: {
              S: 'bar',
            },
          },
        },
        mapToBytes: {
          M: {
            mapTo: {
              B: new TextEncoder().encode('foo'),
            },
            bytes: {
              B: new TextEncoder().encode('bar'),
            },
          },
        },
        mapToBool: {
          M: {
            mapTo: {
              BOOL: true,
            },
            bool: {
              BOOL: false,
            },
          },
        },
        mapToNull: {
          M: {
            mapTo: {
              NULL: false,
            },
            null: {
              NULL: true,
            },
          },
        },
        kvMapToNum: {
          M: {
            kvMapTo: {
              N: '123',
            },
            num: {
              N: '234',
            },
          },
        },
        kvMapToString: {
          M: {
            kvMapTo: {
              S: 'foo',
            },
            str: {
              S: 'bar',
            },
          },
        },
        kvMapToBytes: {
          M: {
            kvMapTo: {
              B: new TextEncoder().encode('foo'),
            },
            bytes: {
              B: new TextEncoder().encode('bar'),
            },
          },
        },
        kvMapToBool: {
          M: {
            kvMapTo: {
              BOOL: true,
            },
            bool: {
              BOOL: false,
            },
          },
        },
        kvMapToNull: {
          M: {
            kvMapTo: {
              NULL: false,
            },
            null: {
              NULL: true,
            },
          },
        },
      },
      true,
    );

    expect(got.publicNum).toEqual(123);
    expect(got.readonlyNum).toEqual(234);
    expect(got.string).toEqual('str');
    expect(got.bytes).toEqual(new TextEncoder().encode('bytes'));
    expect(got.bool).toEqual(true);
    expect(got.nil).toEqual(null);
    expect(got.stringSlice).toEqual(['slice', 'str']);
    expect(got.stringArray).toEqual(new Array<string>('array', 'str'));
    expect(got.numSlice).toEqual([123, 234]);
    expect(got.numArray).toEqual(new Array<number>(345, 456));
    expect(got.numSet).toEqual([123, 234]);
    expect(got.stringSet).toEqual(['set', 'str']);
    expect(got.bytesSet).toEqual([new TextEncoder().encode('set'), new TextEncoder().encode('bytes')]);
    expect(got.mapToNum).toEqual(
      new Map<string, number>([
        ['mapTo', 123],
        ['num', 234],
      ]),
    );
    expect(got.mapToString).toEqual(
      new Map<string, string>([
        ['mapTo', 'foo'],
        ['str', 'bar'],
      ]),
    );
    expect(got.mapToBytes).toEqual(
      new Map<string, Uint8Array>([
        ['mapTo', new TextEncoder().encode('foo')],
        ['bytes', new TextEncoder().encode('bar')],
      ]),
    );
    expect(got.mapToBool).toEqual(
      new Map<string, boolean>([
        ['mapTo', true],
        ['bool', false],
      ]),
    );
    expect(got.mapToNull).toEqual(
      new Map<string, unknown>([
        ['mapTo', undefined],
        ['null', null],
      ]),
    );
    expect(got.kvMapToNum).toEqual({
      kvMapTo: 123,
      num: 234,
    });
    expect(got.kvMapToString).toEqual({ kvMapTo: 'foo', str: 'bar' });
    expect(got.kvMapToBytes).toEqual({
      kvMapTo: new TextEncoder().encode('foo'),
      bytes: new TextEncoder().encode('bar'),
    });
    expect(got.kvMapToBool).toEqual({
      kvMapTo: true,
      bool: false,
    });
    expect(got.kvMapToNull).toEqual({
      kvMapTo: undefined,
      null: null,
    });
  });

  test('support BigInt', () => {
    interface Interface {
      readonly bigint: BigInt;
      readonly bigintSlice: BigInt[];
      readonly bigintArray: Array<BigInt>;
      readonly bigintSet: Set<BigInt>;
      readonly mapToBigint: Map<string, BigInt>;
      readonly kvMapToBigint: { [key: string]: BigInt };
    }

    const got = fromDynamodbRecord<Interface>(
      {
        bigint: { N: '123' },
        bigintSlice: { L: [{ N: '123' }, { N: '234' }] },
        bigintArray: { L: [{ N: '345' }, { N: '456' }] },
        bigintSet: { NS: ['567', '678'] },
        mapToBigint: { M: { bigint: { N: '789' } } },
        kvMapToBigint: { M: { bigint: { N: '890' } } },
      },
      true,
    );
    expect(got.bigint).toEqual(BigInt(123));
    expect(got.bigintSlice).toEqual([BigInt(123), BigInt(234)]);
    expect(got.bigintArray).toEqual(new Array<BigInt>(BigInt(345), BigInt(456)));
    expect(got.bigintSet).toContain(BigInt(567));
    expect(got.bigintSet).toContain(BigInt(678));
    expect(got.mapToBigint).toEqual(new Map([['bigint', BigInt(789)]]));
    expect(got.kvMapToBigint).toEqual({ bigint: BigInt(890) });
  });

  test('for default values', () => {
    interface Interface {
      readonly num?: number;
      readonly numArray: Array<number>;
      readonly numSet: Set<number>;
      readonly mapToNumber: Map<string, number>;
      readonly kvMapToNumber: { [key: string]: number };
    }

    const got = fromDynamodbRecord<Interface>({});
    expect(got.num).toBeUndefined();
    expect(got.numArray).toEqual([]);
    expect(got.numSet).toEqual(new Set());
    expect(got.mapToNumber).toEqual(new Map());
    expect(got.kvMapToNumber).toEqual({});
  });
});
