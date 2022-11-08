import ts from 'typescript';
import {
  DynamodbPrimitiveTypeKinds,
  DynamodbPrimitiveType,
  dynamodbPrimitiveValueToJSValueConvertingOp,
} from './dynamodb_primitive_types';
import { warn } from './logger';

export interface DynamodbItemField {
  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined;
  generateCodeForUnmarshal(argName: string): ts.ObjectLiteralElementLike | undefined;
}

export class PrimitiveField implements DynamodbItemField {
  constructor(private readonly fieldName: string, private readonly fieldType: DynamodbPrimitiveType) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    const toStr = this.fieldType.kind === DynamodbPrimitiveTypeKinds.Number ? '.toString()' : '';

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            this.fieldType.kind,
            ts.factory.createIdentifier(
              `${argName}.${this.fieldName}${toStr}` +
                (this.fieldType.kind === DynamodbPrimitiveTypeKinds.Null ? ' === null' : ''),
            ),
          ),
        ],
        true,
      ),
    );
  }

  generateCodeForUnmarshal(argName: string): ts.ObjectLiteralElementLike | undefined {
    const valueConvertingOp = dynamodbPrimitiveValueToJSValueConvertingOp(this.fieldType);
    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createIdentifier(
        `${valueConvertingOp.leftOp}${argName}['${this.fieldName}']?.${this.fieldType.kind}${valueConvertingOp.rightOp}`,
      ),
    );
  }
}

export class ArrayField implements DynamodbItemField {
  constructor(readonly fieldName: string, readonly valueType: DynamodbPrimitiveType) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    const toStr = this.valueType.kind === DynamodbPrimitiveTypeKinds.Number ? '.toString()' : '';

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            'L',
            ts.factory.createIdentifier(
              `${argName}.${this.fieldName}.map(v => new Object({${this.valueType.kind}: v${toStr}}))`,
            ),
          ),
        ],
        true,
      ),
    );
  }

  generateCodeForUnmarshal(argName: string): ts.ObjectLiteralElementLike | undefined {
    const valueConvertingOp = dynamodbPrimitiveValueToJSValueConvertingOp(this.valueType);
    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createIdentifier(
        `${argName}['${this.fieldName}']?.L?.map(v => ${valueConvertingOp.leftOp}v.${this.valueType.kind}${valueConvertingOp.rightOp})`,
      ),
    );
  }
}

export class SetField implements DynamodbItemField {
  constructor(
    readonly fieldName: string,
    readonly valueType: DynamodbPrimitiveType,
    readonly shouldLenientTypeCheck: boolean,
  ) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    if (
      this.valueType.kind !== DynamodbPrimitiveTypeKinds.String &&
      this.valueType.kind !== DynamodbPrimitiveTypeKinds.Number &&
      this.valueType.kind !== DynamodbPrimitiveTypeKinds.Binary
    ) {
      const msg = `a type parameter of the Set type property "${this.fieldName}" is unsupported one`;
      if (this.shouldLenientTypeCheck) {
        warn(msg);
        return undefined;
      }
      throw new Error(msg);
    }
    const mapToStr = this.valueType.kind === DynamodbPrimitiveTypeKinds.Number ? '.map(v => v.toString())' : '';

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createObjectLiteralExpression(
        [
          ts.factory.createPropertyAssignment(
            this.valueType.kind + 'S',
            ts.factory.createIdentifier(`Array.from(${argName}.${this.fieldName}.values())${mapToStr}`),
          ),
        ],
        true,
      ),
    );
  }

  generateCodeForUnmarshal(argName: string): ts.ObjectLiteralElementLike | undefined {
    const valueConvertingOp = dynamodbPrimitiveValueToJSValueConvertingOp(this.valueType);
    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createIdentifier(
        `${argName}['${this.fieldName}']?.${this.valueType.kind}S?.map(v => ${valueConvertingOp.leftOp}v${valueConvertingOp.rightOp})`,
      ),
    );
  }
}

export class MapField implements DynamodbItemField {
  constructor(
    readonly fieldName: string,
    readonly keyValueType: DynamodbPrimitiveType,
    readonly valueType: DynamodbPrimitiveType,
    readonly shouldLenientTypeCheck: boolean,
  ) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    if (this.keyValueType.kind !== DynamodbPrimitiveTypeKinds.String) {
      const msg = `a Map type property "${this.fieldName}" has non-string key type`;
      if (this.shouldLenientTypeCheck) {
        warn(msg);
        return undefined;
      }
      throw new Error(msg);
    }

    const toStr = this.valueType.kind === DynamodbPrimitiveTypeKinds.Number ? '.toString()' : '';
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
                        this.valueType.kind,
                        ts.factory.createIdentifier(
                          `kv[1]${toStr}` +
                            (this.valueType.kind === DynamodbPrimitiveTypeKinds.Null ? ' === null' : ''),
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

  generateCodeForUnmarshal(argName: string): ts.ObjectLiteralElementLike | undefined {
    const valueIdent = ts.factory.createIdentifier('m');
    const recordIdent = ts.factory.createIdentifier('r');

    const valueConvertingOp = dynamodbPrimitiveValueToJSValueConvertingOp(this.valueType);

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createImmediatelyInvokedFunctionExpression([
        ts.factory.createVariableStatement(
          [],
          [ts.factory.createVariableDeclaration(valueIdent), ts.factory.createVariableDeclaration(recordIdent)],
        ),
        ts.factory.createBinaryExpression(
          valueIdent,
          ts.SyntaxKind.EqualsToken,
          ts.factory.createIdentifier(`new Map()`),
        ),
        ts.factory.createBinaryExpression(
          recordIdent,
          ts.SyntaxKind.EqualsToken,
          ts.factory.createIdentifier(`${argName}['${this.fieldName}']?.M`),
        ),
        ts.factory.createForInStatement(
          ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration('k')], ts.NodeFlags.Const),
          recordIdent,
          ts.factory.createBlock([
            ts.factory.createIdentifier(
              `${valueIdent.text}.set(k, ${valueConvertingOp.leftOp}${recordIdent.text}[k]?.${this.valueType.kind}${valueConvertingOp.rightOp})`,
            ),
          ] as unknown as ts.Statement[]),
        ),
        ts.factory.createReturnStatement(valueIdent),
      ] as ts.Statement[]),
    );
  }
}

export class KeyValuePairMapField implements DynamodbItemField {
  constructor(
    readonly fieldName: string,
    readonly keyValueType: DynamodbPrimitiveType,
    readonly valueType: DynamodbPrimitiveType,
    readonly shouldLenientTypeCheck: boolean,
  ) {}

  generateCode(argName: string): ts.ObjectLiteralElementLike | undefined {
    if (this.keyValueType.kind !== DynamodbPrimitiveTypeKinds.String) {
      const msg = `a Map type property "${this.fieldName}" has non-string key type`;
      if (this.shouldLenientTypeCheck) {
        warn(msg);
        return undefined;
      }
      throw new Error(msg);
    }

    const toStr = this.valueType.kind === DynamodbPrimitiveTypeKinds.Number ? '.toString()' : '';
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
                        this.valueType.kind,
                        ts.factory.createIdentifier(
                          `${argName}.${this.fieldName}[k]${toStr}` +
                            (this.valueType.kind === DynamodbPrimitiveTypeKinds.Null ? ' === null' : ''),
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

  generateCodeForUnmarshal(argName: string): ts.ObjectLiteralElementLike | undefined {
    const valueIdent = ts.factory.createIdentifier('m');
    const recordIdent = ts.factory.createIdentifier('r');

    const valueConvertingOp = dynamodbPrimitiveValueToJSValueConvertingOp(this.valueType);

    return ts.factory.createPropertyAssignment(
      this.fieldName,
      ts.factory.createImmediatelyInvokedFunctionExpression([
        ts.factory.createVariableStatement(
          [],
          [ts.factory.createVariableDeclaration(valueIdent), ts.factory.createVariableDeclaration(recordIdent)],
        ),
        ts.factory.createBinaryExpression(valueIdent, ts.SyntaxKind.EqualsToken, ts.factory.createIdentifier('{}')),
        ts.factory.createBinaryExpression(
          recordIdent,
          ts.SyntaxKind.EqualsToken,
          ts.factory.createIdentifier(`${argName}['${this.fieldName}']?.M`),
        ),
        ts.factory.createForInStatement(
          ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration('k')], ts.NodeFlags.Const),
          recordIdent,
          ts.factory.createBlock([
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier(`${valueIdent.text}[k]`),
              ts.SyntaxKind.EqualsToken,
              ts.factory.createIdentifier(
                `${valueConvertingOp.leftOp}${recordIdent.text}[k]?.${this.valueType.kind}${valueConvertingOp.rightOp}`,
              ),
            ),
          ] as unknown as ts.Statement[]),
        ),
        ts.factory.createReturnStatement(valueIdent),
      ] as ts.Statement[]),
    );
  }
}
