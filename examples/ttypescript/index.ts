import { dynamodbRecord, fromDynamodbRecord } from '../../index';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

interface User {
  readonly id: number;
  readonly name: string;
  readonly tags: Map<string, string>;
}

const record: Record<keyof User, AttributeValue> = dynamodbRecord<User>({
  id: 12345,
  name: 'John Doe',
  tags: new Map<string, string>([
    ['foo', 'bar'],
    ['buz', 'qux'],
  ]),
});
console.log(JSON.stringify(record));

const user: User = fromDynamodbRecord<User>(record);
console.log(user);
