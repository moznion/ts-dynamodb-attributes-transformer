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
  if (typeName === undefined) {
    return undefined;
  }

  const unionTypes: string[] = typeName.split('|').map(t => t.trim());
  const isUndefinedType = (t: string): boolean => t === 'undefined';
  // const isOptionalType = unionTypes.find(isUndefinedType);
  typeName = unionTypes.filter(t => !isUndefinedType(t)).join('|');

  switch (typeName) {
    case 'string':
      return DynamodbPrimitiveTypes.String;
    case 'number':
    case 'BigInt':
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

export interface DynamodbPrimitiveValueToJSValueConvertingOp {
  leftOp: string;
  rightOp: string;
}

export function dynamodbPrimitiveValueToJSValueConvertingOp(
  primitiveType: DynamodbPrimitiveTypes,
): DynamodbPrimitiveValueToJSValueConvertingOp {
  switch (primitiveType) {
    case DynamodbPrimitiveTypes.Number:
      return {
        leftOp: '(() => { const numStr = ',
        rightOp: '; return numStr === undefined ? undefined : Number(numStr); })()',
      };
    case DynamodbPrimitiveTypes.Null:
      return {
        leftOp: '(',
        rightOp: ' === true ? null : undefined)',
      };
    case DynamodbPrimitiveTypes.String:
    case DynamodbPrimitiveTypes.Binary:
    case DynamodbPrimitiveTypes.Boolean:
    default:
      return {
        leftOp: '',
        rightOp: '',
      };
  }
}
