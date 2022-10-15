import ts from 'typescript';

export enum DynamodbPrimitiveTypes {
  String = 'S',
  Number = 'N',
  Boolean = 'BOOL',
  Null = 'NULL',
  Binary = 'B',
}

export function dynamodbPrimitiveTypeFromTypeFlag(flag: ts.TypeFlags | undefined): DynamodbPrimitiveTypes | undefined {
  if (flag === undefined) {
    return undefined;
  }
  if ((flag & ts.TypeFlags.String) === ts.TypeFlags.String) {
    return DynamodbPrimitiveTypes.String;
  }
  if ((flag & ts.TypeFlags.Number) === ts.TypeFlags.Number) {
    return DynamodbPrimitiveTypes.Number;
  }
  if ((flag & ts.TypeFlags.Boolean) === ts.TypeFlags.Boolean) {
    return DynamodbPrimitiveTypes.Boolean;
  }
  if ((flag & ts.TypeFlags.Unknown) === ts.TypeFlags.Unknown) {
    return DynamodbPrimitiveTypes.Null;
  }
  return undefined;
}

export function dynamodbPrimitiveTypeFromName(typeName: string | undefined): DynamodbPrimitiveTypes | undefined {
  switch (typeName) {
    case 'string':
      return DynamodbPrimitiveTypes.String;
    case 'number':
      return DynamodbPrimitiveTypes.Number;
    case 'boolean':
      return DynamodbPrimitiveTypes.Boolean;
    case 'unknown':
      return DynamodbPrimitiveTypes.Null;
    case 'Uint8Array':
      return DynamodbPrimitiveTypes.Binary;
    default:
      return undefined;
  }
}
