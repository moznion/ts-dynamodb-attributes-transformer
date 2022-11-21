import { AttributeValue } from '@aws-sdk/client-dynamodb';

export function dynamodbRecord<T extends object>(
  item: T,
  shouldLenientTypeCheck?: boolean,
): Record<keyof T, AttributeValue>;
export function fromDynamodbRecord<T extends object>(
  attrs: Record<string, AttributeValue>,
  shouldLenientTypeCheck?: boolean,
): T;
