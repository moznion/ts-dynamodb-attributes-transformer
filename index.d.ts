import { AttributeValue } from '@aws-sdk/client-dynamodb';

export function dynamodbRecord<T extends object>(item: T): Record<string, AttributeValue>;
