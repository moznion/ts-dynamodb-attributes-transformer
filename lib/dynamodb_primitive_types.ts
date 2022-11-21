import ts from 'typescript';

export class DynamodbPrimitiveType {
  constructor(public readonly kind: DynamodbPrimitiveTypeKinds, private readonly flag: number) {}

  public isBigInt() {
    return (
      this.kind === DynamodbPrimitiveTypeKinds.Number &&
      (this.flag & DynamodbPrimitiveTypeFlags.BigInt) === DynamodbPrimitiveTypeFlags.BigInt
    );
  }
}

export enum DynamodbPrimitiveTypeKinds {
  String = 'S',
  Number = 'N',
  Boolean = 'BOOL',
  Null = 'NULL',
  Binary = 'B',
}

export enum DynamodbPrimitiveTypeFlags {
  NA = 0b0000,
  BigInt = 0b0001,
}

export function dynamodbPrimitiveTypeFromTypeFlag(flag: ts.TypeFlags | undefined): DynamodbPrimitiveType | undefined {
  if (flag === undefined) {
    return undefined;
  }
  if ((flag & ts.TypeFlags.String) === ts.TypeFlags.String) {
    return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.String, DynamodbPrimitiveTypeFlags.NA);
  }
  if ((flag & ts.TypeFlags.Number) === ts.TypeFlags.Number) {
    return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.Number, DynamodbPrimitiveTypeFlags.NA);
  }
  if ((flag & ts.TypeFlags.Boolean) === ts.TypeFlags.Boolean) {
    return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.Boolean, DynamodbPrimitiveTypeFlags.NA);
  }
  if ((flag & ts.TypeFlags.Unknown) === ts.TypeFlags.Unknown) {
    return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.Null, DynamodbPrimitiveTypeFlags.NA);
  }
  return undefined;
}

export function dynamodbPrimitiveTypeFromName(typeName: string | undefined): DynamodbPrimitiveType | undefined {
  if (typeName === undefined) {
    return undefined;
  }

  const unionTypes: string[] = typeName.split('|').map(t => t.trim());
  const isUndefinedType = (t: string): boolean => t === 'undefined';
  // const isOptionalType = unionTypes.find(isUndefinedType);
  typeName = unionTypes.filter(t => !isUndefinedType(t)).join('|');

  switch (typeName) {
    case 'string':
      return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.String, DynamodbPrimitiveTypeFlags.NA);
    case 'number':
      return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.Number, DynamodbPrimitiveTypeFlags.NA);
    case 'BigInt':
      return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.Number, DynamodbPrimitiveTypeFlags.BigInt);
    case 'boolean':
      return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.Boolean, DynamodbPrimitiveTypeFlags.NA);
    case 'unknown':
      return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.Null, DynamodbPrimitiveTypeFlags.NA);
    case 'Uint8Array':
      return new DynamodbPrimitiveType(DynamodbPrimitiveTypeKinds.Binary, DynamodbPrimitiveTypeFlags.NA);
    default:
      return undefined;
  }
}

export interface DynamodbPrimitiveValueToJSValueConvertingOp {
  leftOp: string;
  rightOp: string;
}

export function dynamodbPrimitiveValueToJSValueConvertingOp(
  primitiveType: DynamodbPrimitiveType,
): DynamodbPrimitiveValueToJSValueConvertingOp {
  switch (primitiveType.kind) {
    case DynamodbPrimitiveTypeKinds.Number:
      return {
        leftOp: '(() => { const numStr = ',
        rightOp: `; return numStr === undefined ? undefined : ${
          primitiveType.isBigInt() ? 'BigInt' : 'Number'
        }(numStr); })()`,
      };
    case DynamodbPrimitiveTypeKinds.Null:
      return {
        leftOp: '(',
        rightOp: ' === true ? null : undefined)',
      };
    case DynamodbPrimitiveTypeKinds.String:
    case DynamodbPrimitiveTypeKinds.Binary:
    case DynamodbPrimitiveTypeKinds.Boolean:
    default:
      return {
        leftOp: '',
        rightOp: '',
      };
  }
}
