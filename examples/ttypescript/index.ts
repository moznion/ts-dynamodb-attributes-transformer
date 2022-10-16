import { dynamodbRecord } from '@moznion/ts-dynamodb-attributes-transformer';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

interface User {
  readonly id: number;
  readonly name: string;
  readonly tags: Map<string, string>;
}

const record: Record<string, AttributeValue> = dynamodbRecord<User>({
  id: 12345,
  name: 'John Doe',
  tags: new Map<string, string>([
    ['foo', 'bar'],
    ['buz', 'qux'],
  ]),
});

console.log(JSON.stringify(record));
