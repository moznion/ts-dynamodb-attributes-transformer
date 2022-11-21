import { dynamodbRecord, fromDynamodbRecord } from '../../index';

interface Obj {
  readonly id: number;
  readonly name: string;
  readonly tags: { [key: string]: string };
  readonly flags: Set<string>;
  readonly nil: unknown;
}

const obj: Obj = {
  id: 12345,
  name: 'John Doe',
  tags: {
    foo: 'bar',
    buz: 'qux',
  },
  flags: new Set(['foo', 'bar']),
  nil: null,
};

export function toDynamoDBRecord() {
  dynamodbRecord<Obj>(obj);
}

export function fromDynamoDBRecord() {
  fromDynamodbRecord<Obj>({
    id: {
      N: '123455',
    },
    name: {
      S: 'John Doe',
    },
    tags: {
      M: {
        foo: {
          S: 'bar',
        },
        buz: {
          S: 'qux',
        },
      },
    },
    flags: {
      SS: ['foo', 'bar'],
    },
  });
}
