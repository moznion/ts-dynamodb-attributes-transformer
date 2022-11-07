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
        readonly numSlice: number[],
        readonly numArray: Array<number>,
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

    const record: Record<keyof Clazz, AttributeValue> = dynamodbRecord<Clazz>(
      new Clazz(
        123,
        234,
        'str',
        new TextEncoder().encode('bytes'),
        true,
        null,
        ['slice', 'str'],
        new Array<string>('array', 'str'),
        [123, 234],
        new Array<number>(345, 456),
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

    expect(Object.keys(record)).toHaveLength(23);
    expect(record['publicNum']).toEqual({ N: '123' });
    expect(record['readonlyNum']).toEqual({ N: '234' });
    expect(record['string']).toEqual({ S: 'str' });
    expect(record['bytes']).toEqual({ B: new TextEncoder().encode('bytes') });
    expect(record['bool']).toEqual({ BOOL: true });
    expect(record['nil']).toEqual({ NULL: true });
    expect(record['stringSlice']).toEqual({ L: [{ S: 'slice' }, { S: 'str' }] });
    expect(record['stringArray']).toEqual({ L: [{ S: 'array' }, { S: 'str' }] });
    expect(record['numSlice']).toEqual({ L: [{ N: '123' }, { N: '234' }] });
    expect(record['numArray']).toEqual({ L: [{ N: '345' }, { N: '456' }] });
    expect(record['numSet']).toEqual({ NS: ['123', '234'] });
    expect(record['stringSet']).toEqual({ SS: ['set', 'str'] });
    expect(record['bytesSet']).toEqual({ BS: [new TextEncoder().encode('set'), new TextEncoder().encode('bytes')] });
    expect(record['mapToNum']).toEqual({
      M: {
        mapTo: { N: '123' },
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

    const record: Record<keyof Clazz, AttributeValue> = dynamodbRecord<Clazz>(new Clazz('foo', 'bar'));
    expect(Object.keys(record)).toHaveLength(0);
  });

  test('ignore unsupported types', () => {
    class Clazz {
      constructor(
        readonly regex: RegExp,
        readonly regexArray: RegExp[],
        readonly regexSet: Set<RegExp>,
        readonly regexMap: Map<string, RegExp>,
        readonly nonStrKeyMap: Map<number, number>,
        readonly unsupportedTypeKeyMap: Map<symbol, string>,
        readonly regexKVMap: { [key: string]: RegExp },
        readonly nonStrKeyKVMap: { [key: number]: number },
        readonly unsupportedTypeKeyKVMap: { [key: symbol]: string },
      ) {}
    }

    const record: Record<keyof Clazz, AttributeValue> = dynamodbRecord<Clazz>(
      new Clazz(
        /re/,
        [/re/],
        new Set([/re/]),
        new Map([['re', /re/]]),
        new Map([[123, 321]]),
        new Map([[Symbol('symbol'), 'foo']]),
        { re: /re/ },
        { 123: 321 },
        {},
      ),
    );
    expect(Object.keys(record)).toHaveLength(0);
  });

  test('support BigInt', () => {
    class Clazz {
      constructor(
        readonly bigint: BigInt,
        readonly bigintSlice: BigInt[],
        readonly bigintArray: Array<BigInt>,
        readonly bigintSet: Set<BigInt>,
        readonly mapToBigint: Map<string, BigInt>,
        readonly kvMapToBigint: { [key: string]: BigInt },
      ) {}
    }
    const record: Record<keyof Clazz, AttributeValue> = dynamodbRecord<Clazz>(
      new Clazz(
        BigInt(123),
        [BigInt(123), BigInt(234)],
        new Array<BigInt>(BigInt(345), BigInt(456)),
        new Set([BigInt(567), BigInt(678)]),
        new Map([['bigint', BigInt(789)]]),
        { bigint: BigInt(890) },
      ),
    );
    expect(record['bigint']).toEqual({ N: '123' });
    expect(record['bigintSlice']).toEqual({ L: [{ N: '123' }, { N: '234' }] });
    expect(record['bigintArray']).toEqual({ L: [{ N: '345' }, { N: '456' }] });
    expect(record['bigintSet']).toEqual({ NS: ['567', '678'] });
    expect(record['mapToBigint']).toEqual({ M: { bigint: { N: '789' } } });
    expect(record['kvMapToBigint']).toEqual({ M: { bigint: { N: '890' } } });
    expect(Object.keys(record)).toHaveLength(6);
  });

  test('interface', () => {
    interface Interface {
      readonly id: number;
      readonly name: string;
      readonly tags: Map<string, string>;
    }
    const record: Record<keyof Interface, AttributeValue> = dynamodbRecord<Interface>({
      id: 12345,
      name: 'John Doe',
      tags: new Map<string, string>([
        ['foo', 'bar'],
        ['buz', 'qux'],
      ]),
    });
    expect(record['id']).toEqual({ N: '12345' });
    expect(record['name']).toEqual({ S: 'John Doe' });
    expect(record['tags']).toEqual({ M: { foo: { S: 'bar' }, buz: { S: 'qux' } } });
    expect(Object.keys(record)).toHaveLength(3);
  });

  test('optional', () => {
    class Clazz {
      constructor(
        readonly optionalStr1: string | undefined,
        readonly optionalStr2: undefined | string,
        readonly optionalStr3?: string,
      ) {}
    }

    {
      const record: Record<keyof Clazz, AttributeValue> = dynamodbRecord<Clazz>(
        new Clazz(undefined, undefined, undefined),
      );
      expect(record['optionalStr1']).toEqual({ S: undefined });
      expect(record['optionalStr2']).toEqual({ S: undefined });
      expect(record['optionalStr3']).toEqual({ S: undefined });
    }

    {
      const record: Record<keyof Clazz, AttributeValue> = dynamodbRecord<Clazz>(new Clazz('foo', 'bar', 'buz'));
      expect(record['optionalStr1']).toEqual({ S: 'foo' });
      expect(record['optionalStr2']).toEqual({ S: 'bar' });
      expect(record['optionalStr3']).toEqual({ S: 'buz' });
    }
  });
});
