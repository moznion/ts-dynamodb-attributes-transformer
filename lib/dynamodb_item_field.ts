import ts from 'typescript';
import { DynamodbPrimitiveTypes } from './dynamodb_primitive_types';
import { warn } from './logger';

export interface DynamodbItemField {
  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined;
}

export class PrimitiveField implements DynamodbItemField {
  constructor(private readonly fieldName: string, private readonly fieldType: DynamodbPrimitiveTypes) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    const toStr = this.fieldType === DynamodbPrimitiveTypes.Number ? '.toString()' : '';

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            this.fieldType,
            ts.factory.createIdentifier(
              `${argName}.${this.fieldName}${toStr}` +
                (this.fieldType === DynamodbPrimitiveTypes.Null ? ' === null' : ''),
            ),
          ),
        ],
        true,
      ),
    );
  }
}

export class ArrayField implements DynamodbItemField {
  constructor(readonly fieldName: string, readonly valueType: DynamodbPrimitiveTypes) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    const toStr = this.valueType === DynamodbPrimitiveTypes.Number ? '.toString()' : '';

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            'L',
            ts.factory.createIdentifier(
              `${argName}.${this.fieldName}.map(v => new Object({${this.valueType}: v${toStr}}))`,
            ),
          ),
        ],
        true,
      ),
    );
  }
}

export class SetField implements DynamodbItemField {
  constructor(
    readonly fieldName: string,
    readonly valueType: DynamodbPrimitiveTypes,
    readonly shouldLenientTypeCheck: boolean,
  ) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    if (
      this.valueType !== DynamodbPrimitiveTypes.String &&
      this.valueType !== DynamodbPrimitiveTypes.Number &&
      this.valueType !== DynamodbPrimitiveTypes.Binary
    ) {
      const msg = `a type parameter of the Set type property "${this.fieldName}" is unsupported one`;
      if (this.shouldLenientTypeCheck) {
        warn(msg);
        return undefined;
      }
      throw new Error(msg);
    }
    const mapToStr = this.valueType === DynamodbPrimitiveTypes.Number ? '.map(v => `${v}`)' : '';

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            this.valueType + 'S',
            ts.factory.createIdentifier(`Array.from(${argName}.${this.fieldName}.values())${mapToStr}`),
          ),
        ],
        true,
      ),
    );
  }
}

export class MapField implements DynamodbItemField {
  constructor(
    readonly fieldName: string,
    readonly keyValueType: DynamodbPrimitiveTypes,
    readonly valueType: DynamodbPrimitiveTypes,
    readonly shouldLenientTypeCheck: boolean,
  ) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    if (this.keyValueType !== DynamodbPrimitiveTypes.String) {
      const msg = `a Map type property "${this.fieldName}" has non-string key type`;
      if (this.shouldLenientTypeCheck) {
        warn(msg);
        return undefined;
      }
      throw new Error(msg);
    }

    const toStr = this.valueType === DynamodbPrimitiveTypes.Number ? '.toString()' : '';
    const recordIdent = ts.factory.createIdentifier('m');

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            'M',
            ts.factory.createImmediatelyInvokedFunctionExpression([
              ts.factory.createVariableStatement([], [ts.factory.createVariableDeclaration(recordIdent)]),
              ts.factory.createBinaryExpression(
                recordIdent,
                ts.SyntaxKind.EqualsToken,
                ts.factory.createIdentifier('{}'),
              ),
              ts.factory.createForOfStatement(
                undefined,
                ts.factory.createVariableDeclarationList(
                  [ts.factory.createVariableDeclaration('kv')],
                  ts.NodeFlags.Const,
                ),
                ts.factory.createIdentifier(`${argName}.${this.fieldName}`),
                ts.factory.createBlock([
                  ts.factory.createBinaryExpression(
                    ts.factory.createIdentifier(`${recordIdent.text}[kv[0]]`),
                    ts.SyntaxKind.EqualsToken,
                    ts.factory.createObjectLiteralExpression([
                      ts.factory.createPropertyAssignment(
                        this.valueType,
                        ts.factory.createIdentifier(
                          `kv[1]${toStr}` + (this.valueType === DynamodbPrimitiveTypes.Null ? ' === null' : ''),
                        ),
                      ),
                    ]),
                  ),
                ] as unknown as ts.Statement[]),
              ),
              ts.factory.createReturnStatement(recordIdent),
            ] as ts.Statement[]),
          ),
        ],
        true,
      ),
    );
  }
}

export class KeyValuePairMapField implements DynamodbItemField {
  constructor(
    readonly fieldName: string,
    readonly keyValueType: DynamodbPrimitiveTypes,
    readonly valueType: DynamodbPrimitiveTypes,
    readonly shouldLenientTypeCheck: boolean,
  ) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    if (this.keyValueType !== DynamodbPrimitiveTypes.String) {
      const msg = `a Map type property "${this.fieldName}" has non-string key type`;
      if (this.shouldLenientTypeCheck) {
        warn(msg);
        return undefined;
      }
      throw new Error(msg);
    }

    const toStr = this.valueType === DynamodbPrimitiveTypes.Number ? '.toString()' : '';
    const recordIdent = ts.factory.createIdentifier('m');

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            'M',
            ts.factory.createImmediatelyInvokedFunctionExpression([
              ts.factory.createVariableStatement([], [ts.factory.createVariableDeclaration(recordIdent)]),
              ts.factory.createBinaryExpression(
                recordIdent,
                ts.SyntaxKind.EqualsToken,
                ts.factory.createIdentifier('{}'),
              ),
              ts.factory.createForInStatement(
                ts.factory.createVariableDeclarationList(
                  [ts.factory.createVariableDeclaration('k')],
                  ts.NodeFlags.Const,
                ),
                ts.factory.createIdentifier(`${argName}.${this.fieldName}`),
                ts.factory.createBlock([
                  ts.factory.createBinaryExpression(
                    ts.factory.createIdentifier(`${recordIdent.text}[k]`),
                    ts.SyntaxKind.EqualsToken,
                    ts.factory.createObjectLiteralExpression([
                      ts.factory.createPropertyAssignment(
                        this.valueType,
                        ts.factory.createIdentifier(
                          `${argName}.${this.fieldName}[k]${toStr}` +
                            (this.valueType === DynamodbPrimitiveTypes.Null ? ' === null' : ''),
                        ),
                      ),
                    ]),
                  ),
                ] as unknown as ts.Statement[]),
              ),
              ts.factory.createReturnStatement(recordIdent),
            ] as ts.Statement[]),
          ),
        ],
        true,
      ),
    );
  }
}
