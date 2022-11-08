import ts from 'typescript';
import { FieldsCollector } from './fields_collector';

export class DynamodbRecordTransformer {
  public static readonly funcName = 'dynamodbRecord';
  private static readonly shouldLenientTypeCheck = !!process.env['TS_DYNAMODB_ATTR_TRANSFORMER_LENIENT_TYPE_CHECK']; // TODO

  public static visitNode(node: ts.CallExpression, typeChecker: ts.TypeChecker): ts.Node | undefined {
    if (node.typeArguments === undefined || node.typeArguments.length !== 1 || !node.typeArguments[0]) {
      throw new Error(
        `No type argument on ${DynamodbRecordTransformer.funcName}(). Please put a type argument on the function`,
      );
    }

    const typeArg = node.typeArguments[0];
    const typeName = typeArg.getText();
    if (node.arguments.length !== 1 || !node.arguments[0]) {
      throw new Error(
        `No argument on ${DynamodbRecordTransformer.funcName}(). Please put an argument that has ${typeName} type on the function`,
      );
    }

    const type = typeChecker.getTypeFromTypeNode(typeArg);
    if (!type.isClassOrInterface()) {
      throw new Error(
        `A type parameter of ${DynamodbRecordTransformer.funcName}() must be class or interface, but ${typeName} is not`,
      );
    }

    const argVarNameIdent = ts.factory.createIdentifier('arg');
    const objectProps = new FieldsCollector(
      DynamodbRecordTransformer.funcName,
      DynamodbRecordTransformer.shouldLenientTypeCheck,
    )
      .collectFields(node, typeChecker, typeName, type)
      .map(field => {
        return field?.generateCode(argVarNameIdent.text);
      })
      .filter((c): c is ts.ObjectLiteralElementLike => !!c);

    return ts.factory.createImmediatelyInvokedFunctionExpression(
      [ts.factory.createReturnStatement(ts.factory.createObjectLiteralExpression(objectProps, true))] as ts.Statement[],
      ts.factory.createParameterDeclaration(
        [],
        undefined,
        argVarNameIdent,
        undefined,
        node.typeArguments[0],
        undefined,
      ),
      node.arguments[0],
    );
  }
}
